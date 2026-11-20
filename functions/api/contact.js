// Cloudflare Pages Function: POST /api/contact
// Envía el formulario de contacto por correo con ZeptoMail (API).
//
// Variables de entorno (Cloudflare Pages > Settings > Variables and Secrets):
//   ZEPTOMAIL_TOKEN   (Secret, obligatorio)  Token "Send Mail" del agente de ZeptoMail.
//                     Pégalo tal cual lo da ZeptoMail; si empieza con "Zoho-enczapikey " se respeta.
//   FROM_EMAIL        (obligatorio)          Remitente en un dominio verificado en ZeptoMail,
//                     por ejemplo: no-reply@endemicasocial.com
//   TO_EMAIL          (opcional)             Destino. Por defecto: endemicasocial@gmail.com
//   ZEPTOMAIL_API_URL (opcional)             Por defecto https://api.zeptomail.com/v1.1/email
//                     (cambia el dominio si tu cuenta está en otra región: .eu, .in, .com.au, etc.)

const DEFAULT_TO = 'endemicasocial@gmail.com';
const DEFAULT_API = 'https://api.zeptomail.com/v1.1/email';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clean = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

// Evita inyección de encabezados en asunto / nombre
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) data = await request.json();
    else data = Object.fromEntries((await request.formData()).entries());
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Anti-spam: campo trampa (los humanos no lo ven) y tiempo mínimo de llenado
  // Si el campo honeypot tiene contenido, asumimos que es un bot y fingimos éxito
  if (clean(data.hp, 50)) return json({ ok: true }); // fingimos éxito
  
  const elapsed = Number(data.t);
  // Validación de tiempo: si el formulario se envió en menos de 2000ms, es probable que sea un bot
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2000) return json({ ok: true });
  
  // Nota: Para producción, se recomienda agregar rate limiting en Cloudflare Dashboard
  // para prevenir envíos masivos del formulario. Límites sugeridos: 5 envíos por minuto
  // por IP, con ventana de reseteo de 60 segundos.

  const name = oneLine(data.name, 120);
  const email = oneLine(data.email, 200);
  const whatsapp = oneLine(data.whatsapp, 40);
  const organization = oneLine(data.organization, 160);
  const message = clean(data.message, 4000);
  const lang = data.lang === 'en' ? 'en' : 'es';

  if (!name || !EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid' }, 400);

  if (!env.ZEPTOMAIL_TOKEN || !env.FROM_EMAIL) {
    console.error('Faltan variables de entorno: ZEPTOMAIL_TOKEN y/o FROM_EMAIL');
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  const to = env.TO_EMAIL || DEFAULT_TO;
  const token = env.ZEPTOMAIL_TOKEN.startsWith('Zoho-enczapikey')
    ? env.ZEPTOMAIL_TOKEN
    : `Zoho-enczapikey ${env.ZEPTOMAIL_TOKEN}`;

  const rows = [
    ['Nombre', name],
    ['Correo', email],
    ['WhatsApp', whatsapp || '—'],
    ['Organización o proyecto', organization || '—'],
    ['Idioma del sitio', lang === 'en' ? 'Inglés' : 'Español'],
  ];
  const htmlbody =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0a4231">` +
    `<h2 style="color:#ed0678;margin:0 0 12px">Nuevo contacto desde el sitio de Endémica</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse">` +
    rows.map(([k, v]) => `<tr><td style="font-weight:bold;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') +
    `</table><p style="margin:16px 0 4px;font-weight:bold">¿En qué te podemos apoyar?</p>` +
    `<p style="white-space:pre-wrap;margin:0">${esc(message || '—')}</p></div>`;

  const payload = {
    from: { address: env.FROM_EMAIL, name: 'Sitio web Endémica' },
    to: [{ email_address: { address: to, name: 'Endémica' } }],
    reply_to: [{ address: email, name }],
    subject: `Nuevo contacto desde Endémica: ${name}`.slice(0, 200),
    htmlbody,
  };

  try {
    const res = await fetch(env.ZEPTOMAIL_API_URL || DEFAULT_API, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('ZeptoMail error', res.status, await res.text());
      return json({ ok: false, error: 'send_failed' }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('ZeptoMail fetch failed', err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }
}

// Cualquier otro método
export async function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
