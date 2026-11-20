# Cambios aplicados (Endémica)

## Configuración del formulario
El formulario se envía desde `mail.php` mediante el servicio de correo configurado en el VPS.
El destinatario está configurado como `administrativo@endemicasocial.com`.
Protecciones: campo trampa y tiempo mínimo de llenado (sin Turnstile).

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

### Protección anti-spam en `mail.php`
- Campo honeypot (`hp`): si tiene contenido, se finge éxito.
- Validación de nombre y correo electrónico.
- Validación del método HTTP y sanitización de los campos.

## Estructura
- `assets/css/endemica.css`: capa final con tokens del Figma (contenedor 1260px, H1 80px / H2 60px, imágenes sin deformar, header fijo, menú móvil, selector de idioma).
- `en/`: versión en inglés de las 6 páginas. Selector ES/EN en menú y footer.
- Se eliminó `mail.php` (obsoleto) y 4 logos rotos del carrusel (Frame 41, 42, 47, 48).
