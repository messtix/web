<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

function clean_field($value, $maxLength = 255) {
    $value = trim((string) $value);
    $value = preg_replace('/[\r\n]+/', ' ', $value);
    return mb_substr($value, 0, $maxLength);
}

function client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Basic file-based rate limiting: max 5 submissions per IP per hour.
 * Fails open (allows the request) if the store can't be read/written,
 * so a filesystem hiccup never blocks legitimate messages.
 */
function rate_limited($ip) {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        return false;
    }

    $file = $dir . '/rate-limit.json';
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return false;
    }

    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $store = json_decode($raw ?: '{}', true);
    if (!is_array($store)) {
        $store = [];
    }

    $now = time();
    $window = 3600; // 1 hour
    $limit = 5;
    $key = hash('sha256', $ip);

    $timestamps = array_filter($store[$key] ?? [], function ($t) use ($now, $window) {
        return ($now - $t) < $window;
    });

    $blocked = count($timestamps) >= $limit;

    if (!$blocked) {
        $timestamps[] = $now;
    }
    $store[$key] = array_values($timestamps);

    // Prune entries for other IPs that have fully expired to keep the file small.
    foreach ($store as $k => $times) {
        $times = array_filter($times, function ($t) use ($now, $window) {
            return ($now - $t) < $window;
        });
        if (empty($times)) {
            unset($store[$k]);
        } else {
            $store[$k] = array_values($times);
        }
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($store));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $blocked;
}

// Honeypot: a field real visitors never see or fill. Bots that auto-fill every
// field will trip this, and we quietly pretend success so they move on.
$honeypot = trim((string) ($_POST['company'] ?? ''));
if ($honeypot !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

// Timing check: reject submissions faster than a human could realistically fill
// the form (bots that skip the honeypot still tend to submit almost instantly).
$startedAt = (int) ($_POST['started_at'] ?? 0);
$elapsedMs = $startedAt > 0 ? (round(microtime(true) * 1000) - $startedAt) : PHP_INT_MAX;
if ($elapsedMs < 2500) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'too_fast']);
    exit;
}

if (rate_limited(client_ip())) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'rate_limited']);
    exit;
}

$name = clean_field($_POST['name'] ?? '', 100);
$email = clean_field($_POST['email'] ?? '', 150);
$message = mb_substr(trim((string) ($_POST['message'] ?? '')), 0, 5000);

if ($name === '' || $email === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'invalid_input']);
    exit;
}

$to = 'info@messtix.com';
$subject = "Formulario de Contacto - messtix.com: $name";

$body = "Nombre: $name\n";
$body .= "Correo: $email\n";
$body .= "IP: " . client_ip() . "\n\n";
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
