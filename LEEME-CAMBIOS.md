# Cambios aplicados (Endémica)

## Configuración requerida en Cloudflare Pages (formulario)
Variables de entorno (Settings → Environment variables):
- `ZEPTOMAIL_TOKEN` (secret): token de envío de ZeptoMail (con o sin prefijo `Zoho-enczapikey`).
- `FROM_EMAIL`: remitente en un dominio verificado en ZeptoMail (SPF/DKIM).
- `TO_EMAIL` (opcional): por defecto `contacto@endemicasocial.com`.
- `ZEPTOMAIL_API_URL` (opcional): según región (por defecto `https://api.zeptomail.com/v1.1/email`).
Función: `functions/api/contact.js`. Protección: campo trampa + tiempo mínimo (sin Turnstile).

## Estructura
- `assets/css/endemica.css`: capa final con tokens del Figma (contenedor 1260px, H1 80px / H2 60px, imágenes sin deformar, header fijo, menú móvil, selector de idioma).
- `en/`: versión en inglés de las 6 páginas. Selector ES/EN en menú y footer.
- Se eliminó `mail.php` (obsoleto) y 4 logos rotos del carrusel (Frame 41, 42, 47, 48).
