<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Carga PHPMailer (soporta Composer o descarga directa en ./phpmailer/src/)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} elseif (file_exists(__DIR__ . '/phpmailer/src/PHPMailer.php')) {
    require __DIR__ . '/phpmailer/src/Exception.php';
    require __DIR__ . '/phpmailer/src/PHPMailer.php';
    require __DIR__ . '/phpmailer/src/SMTP.php';
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'PHPMailer no está instalado en el servidor']);
    exit;
}

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

// Lee datos de POST tradicional o JSON
$input = $_POST;
if (empty($input)) {
    $rawBody = file_get_contents('php://input');
    $decoded = json_decode((string) $rawBody, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

$nombre  = trim((string) ($input['name'] ?? $input['nombre'] ?? ''));
$email   = trim((string) ($input['email'] ?? $input['correo'] ?? ''));
$asunto  = trim((string) ($input['subject'] ?? $input['asunto'] ?? 'Nuevo mensaje desde el sitio web'));
$mensaje = trim((string) ($input['message'] ?? $input['mensaje'] ?? ''));
$whatsapp = trim((string) ($input['whatsapp'] ?? ''));
$organization = trim((string) ($input['organization'] ?? $input['organizacion'] ?? ''));

if ($nombre === '' || $mensaje === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Completa nombre, un correo válido y el mensaje.'
    ]);
    exit;
}

// Configuración SMTP mediante variables de entorno del servidor.
$smtpHost = getenv('SMTP_HOST') ?: 'smtp.zoho.com';
$smtpPort = (int) (getenv('SMTP_PORT') ?: 587);
$smtpUser = getenv('SMTP_USER') ?: 'administrativo@endemicasocial.com';
$smtpPass = getenv('SMTP_PASS') ?: '';
$fromAddr = getenv('SMTP_FROM') ?: 'administrativo@endemicasocial.com';
$fromName = getenv('SMTP_FROM_NAME') ?: 'Sitio web Endémica Social';
$toAddr   = getenv('CONTACT_TO') ?: 'administrativo@endemicasocial.com';
$toName   = getenv('CONTACT_TO_NAME') ?: 'Administración Endémica Social';

if ($smtpPass === '') {
    error_log('Error PHPMailer en mail.php: SMTP_PASS no está configurada');
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'El servicio de correo no está configurado.']);
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpPort;
    $mail->CharSet    = PHPMailer::CHARSET_UTF8;

    // Remitente fijo igual a la cuenta autenticada + Reply-To del visitante
    $mail->setFrom($fromAddr, $fromName);
    $mail->addAddress($toAddr, $toName);
    $mail->addReplyTo($email, $nombre);

    $safeNombre  = htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail   = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeAsunto  = htmlspecialchars($asunto, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMensaje = nl2br(htmlspecialchars($mensaje, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $safeWhatsapp = htmlspecialchars($whatsapp, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeOrganization = htmlspecialchars($organization, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $mail->isHTML(true);
    $mail->Subject = 'Contacto web: ' . mb_substr($asunto, 0, 120);
    $mail->Body    = "<h3>Nuevo mensaje desde el formulario web</h3>"
                   . "<p><strong>Nombre:</strong> {$safeNombre}</p>"
                   . "<p><strong>Correo:</strong> {$safeEmail}</p>"
                   . "<p><strong>WhatsApp:</strong> " . ($safeWhatsapp ?: '—') . "</p>"
                   . "<p><strong>Organización o proyecto:</strong> " . ($safeOrganization ?: '—') . "</p>"
                   . "<p><strong>Asunto:</strong> {$safeAsunto}</p>"
                   . "<p><strong>Mensaje:</strong><br>{$safeMensaje}</p>";
    $mail->AltBody = "Nombre: {$nombre}\n"
                   . "Correo: {$email}\n"
                   . "WhatsApp: " . ($whatsapp ?: '—') . "\n"
                   . "Organización o proyecto: " . ($organization ?: '—') . "\n"
                   . "Asunto: {$asunto}\n\n"
                   . "Mensaje:\n{$mensaje}";

    $mail->send();

    http_response_code(200);
    echo json_encode(['ok' => true, 'message' => 'Mensaje enviado correctamente.']);
} catch (Exception $e) {
    error_log('Error PHPMailer en mail.php: ' . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'No se pudo enviar el correo en este momento.'
    ]);
}