<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

function clean_field($value) {
    $value = trim((string) $value);
    return preg_replace('/[\r\n]+/', ' ', $value);
}

$name = clean_field($_POST['name'] ?? '');
$email = clean_field($_POST['email'] ?? '');
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'invalid_input']);
    exit;
}

$to = 'info@messtix.com';
$subject = "Formulario de Contacto - messtix.com: $name";

$body = "Nombre: $name\n";
$body .= "Correo: $email\n\n";
$body .= "Mensaje:\n$message\n";

$headers = [];
$headers[] = 'From: Formulario Messtix <no-reply@messtix.com>';
$headers[] = "Reply-To: $email";
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'send_failed']);
}
