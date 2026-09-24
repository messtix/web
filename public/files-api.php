<?php
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

define('DATA_DIR', __DIR__ . '/data');
define('RESOURCES_FILE', DATA_DIR . '/files.json');
define('LOGIN_ATTEMPTS_FILE', DATA_DIR . '/files-login-attempts.json');
define('UPLOAD_DIR', __DIR__ . '/files/uploads');

// Fixed participant credentials for the shared resource directory.
// Not stored in a data file, so there is nothing here that a fresh
// static-file re-deploy could ever overwrite or lose.
const PARTICIPANT_USERNAME = 'participante';
const PARTICIPANT_PASSWORD_HASH = '$2y$12$/njCG3f5xyJ2ftlDv6migOBi/mf0cKP.ZvKM/boi8lfxf2wD7npAy';

function fail($code, $error) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $error]);
    exit;
}

function is_admin_logged_in() {
    // Shared session with blog-api.php: the same admin login covers this area too.
    return !empty($_SESSION['admin']);
}

function require_admin() {
    if (!is_admin_logged_in()) {
        fail(401, 'unauthorized');
    }
}

function is_participant_logged_in() {
    return !empty($_SESSION['archivos_participant']);
}

function require_participant() {
    if (!is_participant_logged_in() && !is_admin_logged_in()) {
        fail(401, 'unauthorized');
    }
}

function client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function read_json_file($path, $default) {
    if (!file_exists($path)) {
        return $default;
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    return $data === null ? $default : $data;
}

function write_resources($resources) {
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
        return false;
    }
    $fp = fopen(RESOURCES_FILE, 'c+');
    if (!$fp) {
        return false;
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($resources, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

/**
 * Simple rate limiter shared shape with blog-api.php: max attempts per
 * window per IP, keyed by a hashed IP + a namespace so admin and
 * participant login attempts don't share the same bucket.
 */
function rate_limited($ip, $namespace, $limit = 10, $window = 900) {
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
        return false;
    }
    $fp = @fopen(LOGIN_ATTEMPTS_FILE, 'c+');
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
    $key = hash('sha256', $namespace . '|' . $ip);

    $timestamps = array_values(array_filter($store[$key] ?? [], fn($t) => ($now - $t) < $window));
    $blocked = count($timestamps) >= $limit;
    if (!$blocked) {
        $timestamps[] = $now;
    }
    $store[$key] = $timestamps;

    foreach ($store as $k => $times) {
        $times = array_values(array_filter($times, fn($t) => ($now - $t) < $window));
        if (empty($times)) {
            unset($store[$k]);
        } else {
            $store[$k] = $times;
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

const TYPES = ['folder', 'link', 'file'];

function normalize_url($url) {
    $url = trim((string) $url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ---- Participant: login ----
if ($method === 'POST' && $action === 'participant_login') {
    if (rate_limited(client_ip(), 'participant', 10, 900)) {
        fail(429, 'rate_limited');
    }

    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $validUser = hash_equals(PARTICIPANT_USERNAME, $username);
    $validPass = password_verify($password, PARTICIPANT_PASSWORD_HASH);

    if (!$validUser || !$validPass) {
        fail(401, 'invalid_credentials');
    }

    session_regenerate_id(true);
    $_SESSION['archivos_participant'] = true;
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Participant: logout ----
if ($method === 'POST' && $action === 'participant_logout') {
    unset($_SESSION['archivos_participant']);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Participant/Admin: session check ----
if ($method === 'GET' && $action === 'check') {
    echo json_encode([
        'ok' => true,
        'loggedIn' => is_participant_logged_in() || is_admin_logged_in(),
    ]);
    exit;
}

// ---- Participant (or admin): list resources ----
if ($method === 'GET' && $action === 'list') {
    require_participant();
    $resources = read_json_file(RESOURCES_FILE, []);
    usort($resources, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    $summaries = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? '',
            'type' => $r['type'],
            'url' => $r['url'],
        ];
    }, $resources);
    echo json_encode(['ok' => true, 'resources' => $summaries]);
    exit;
}

// ---- Admin: list all resources (same data, kept separate for clarity) ----
if ($method === 'GET' && $action === 'admin_list') {
    require_admin();
    $resources = read_json_file(RESOURCES_FILE, []);
    usort($resources, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    echo json_encode(['ok' => true, 'resources' => $resources]);
    exit;
}

// ---- Admin: create or update a resource ----
if ($method === 'POST' && $action === 'save') {
    require_admin();

    $title = trim((string) ($_POST['title'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $type = trim((string) ($_POST['type'] ?? ''));
    $rawUrl = trim((string) ($_POST['url'] ?? ''));
    $id = trim((string) ($_POST['id'] ?? ''));

    if ($title === '' || !in_array($type, TYPES, true)) {
        fail(422, 'invalid_input');
    }

    // Uploaded files already come back as a same-origin absolute path
    // (e.g. /files/uploads/xxx.pdf) from the upload endpoint; only
    // normalize/validate when it looks like an external URL.
    $url = str_starts_with($rawUrl, '/') ? $rawUrl : normalize_url($rawUrl);
    if ($url === '') {
        fail(422, 'invalid_url');
    }

    $resources = read_json_file(RESOURCES_FILE, []);

    if ($id !== '') {
        $found = false;
        foreach ($resources as &$r) {
            if ($r['id'] === $id) {
                $r['title'] = $title;
                $r['description'] = $description;
                $r['type'] = $type;
                $r['url'] = $url;
                $r['updated_at'] = date('c');
                $found = true;
                break;
            }
        }
        unset($r);
        if (!$found) {
            fail(404, 'not_found');
        }
    } else {
        $id = bin2hex(random_bytes(8));
        $maxOrder = 0;
        foreach ($resources as $r) {
            $maxOrder = max($maxOrder, $r['order'] ?? 0);
        }
        $resources[] = [
            'id' => $id,
            'title' => $title,
            'description' => $description,
            'type' => $type,
            'url' => $url,
            'order' => $maxOrder + 1,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];
    }

    write_resources($resources);
    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

// ---- Admin: delete a resource ----
if ($method === 'POST' && $action === 'delete') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $resources = read_json_file(RESOURCES_FILE, []);
    $remaining = array_values(array_filter($resources, fn($r) => $r['id'] !== $id));
    write_resources($remaining);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: move a resource up/down in display order ----
if ($method === 'POST' && $action === 'reorder') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $direction = $_POST['direction'] ?? '';

    $resources = read_json_file(RESOURCES_FILE, []);
    usort($resources, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));

    $index = null;
    foreach ($resources as $i => $r) {
        if ($r['id'] === $id) {
            $index = $i;
            break;
        }
    }
    if ($index === null) {
        fail(404, 'not_found');
    }

    $swapWith = $direction === 'up' ? $index - 1 : $index + 1;
    if ($swapWith < 0 || $swapWith >= count($resources)) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $orderA = $resources[$index]['order'] ?? $index;
    $orderB = $resources[$swapWith]['order'] ?? $swapWith;
    $resources[$index]['order'] = $orderB;
    $resources[$swapWith]['order'] = $orderA;

    write_resources($resources);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: upload a file resource ----
if ($method === 'POST' && $action === 'upload') {
    require_admin();

    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        fail(422, 'upload_failed');
    }

    $file = $_FILES['file'];
    $maxBytes = 25 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        fail(422, 'file_too_large');
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
        'application/zip' => 'zip',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'application/vnd.ms-powerpoint' => 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!isset($allowed[$mime])) {
        fail(422, 'invalid_file_type');
    }

    if (!is_dir(UPLOAD_DIR) && !@mkdir(UPLOAD_DIR, 0755, true)) {
        fail(500, 'upload_dir_failed');
    }

    $ext = $allowed[$mime];
    $filename = bin2hex(random_bytes(10)) . '.' . $ext;
    $dest = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        fail(500, 'move_failed');
    }

    echo json_encode(['ok' => true, 'url' => '/files/uploads/' . $filename]);
    exit;
}

fail(400, 'unknown_action');
