# Cambios aplicados (Endémica)

## Configuración requerida en Cloudflare Pages (formulario)
Variables de entorno (Settings → Environment variables):
- `ZEPTOMAIL_TOKEN` (secret): token de envío de ZeptoMail (con o sin prefijo `Zoho-enczapikey`).
- `FROM_EMAIL`: remitente en un dominio verificado en ZeptoMail (SPF/DKIM).
- `TO_EMAIL` (opcional): por defecto `endemicasocial@gmail.com`.
- `ZEPTOMAIL_API_URL` (opcional): según región (por defecto `https://api.zeptomail.com/v1.1/email`).
Función: `functions/api/contact.js`. Protección: campo trampa + tiempo mínimo (sin Turnstile).

## Seguridad aplicada
### Headers de seguridad (`_headers`)
- Se agregó archivo `_headers` en la raíz del proyecto para que Cloudflare Pages sirva headers de seguridad:
  - `Content-Security-Policy`: restringe fuentes de scripts, styles, imágenes, conexiones y frames; permite los iframes de Google Maps usados en la página de contacto
  - `X-Content-Type-Options: nosniff`: previene MIME-type sniffing
  - `X-Frame-Options: DENY`: previene clickjacking
  - `Referrer-Policy: strict-origin-when-cross-origin`: controla información del referrer
  - `Permissions-Policy`: desactiva cámara, micrófono y geolocation por defecto

### .gitignore (nuevo)
- Se creó `.gitignore` en la raíz para prevenir commits accidentales de:
  - Variables de entorno (`/functions/api/.env*`)
  - Archivos de lock de dependencias
  - Outputs de build (`/dist`, `/build`)
  - Archivos de IDE y sistemas operativos

### Mejora en `functions/api/contact.js`
- Se añadieron comentarios documentando la protección anti-spam:
  - Campo honeypot (`hp`): si tiene contenido, se asume bot y se finge éxito
  - Tiempo de llenado: envíos < 2000ms son probablemente bots
  - Recomendación de rate limiting en Cloudflare Dashboard:
    - Límite sugerido: 5 envíos por minuto por IP
    - Ventana de reseteo: 60 segundos

### Protección de secrets
- Las variables `ZEPTOMAIL_TOKEN` y `FROM_EMAIL` deben configurarse como secrets en Cloudflare Pages > Settings > Variables and Secrets
- Ahora están protegidas en `.gitignore` para evitar commits accidentales

## Estructura
- `assets/css/endemica.css`: capa final con tokens del Figma (contenedor 1260px, H1 80px / H2 60px, imágenes sin deformar, header fijo, menú móvil, selector de idioma).
- `en/`: versión en inglés de las 6 páginas. Selector ES/EN en menú y footer.
- Se eliminó `mail.php` (obsoleto) y 4 logos rotos del carrusel (Frame 41, 42, 47, 48).
