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
define('GUIDES_FILE', DATA_DIR . '/guides.json');
define('LOGIN_ATTEMPTS_FILE', DATA_DIR . '/files-login-attempts.json');
define('UPLOAD_DIR', __DIR__ . '/files/uploads');
define('GUIDES_DIR', __DIR__ . '/files/guias');

// Fixed participant credentials for the shared resource directory.
// Not stored in a data file, so there is nothing here that a fresh
// static-file re-deploy could ever overwrite or lose.
const PARTICIPANT_USERNAME = 'participante';
const PARTICIPANT_PASSWORD_HASH = '$2y$12$2Ye1o1Izz5Pu8dDzsZBo5uPKhcTQtVpTHY/d79l.87KbQBFMoSwxW';

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

function write_json_file($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        return false;
    }
    $fp = fopen($path, 'c+');
    if (!$fp) {
        return false;
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

function write_resources($resources) {
    return write_json_file(RESOURCES_FILE, $resources);
}

function write_guides($guides) {
    return write_json_file(GUIDES_FILE, $guides);
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

const ALLOWED_MIME_TYPES = [
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

/**
 * Validates an uploaded file against the shared allow-list and moves it
 * into $dir, keeping its original file name (sanitized) so the link a
 * visitor downloads matches what was uploaded, instead of a random
 * token. A numeric suffix is appended only if that name is already
 * taken in the destination directory.
 */
function store_uploaded_file($file, $dir, $maxBytes) {
    if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
        fail(422, 'upload_failed');
    }
    if ($file['size'] > $maxBytes) {
        fail(422, 'file_too_large');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!isset(ALLOWED_MIME_TYPES[$mime])) {
        fail(422, 'invalid_file_type');
    }

    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        fail(500, 'upload_dir_failed');
    }

    $ext = ALLOWED_MIME_TYPES[$mime];
    $base = pathinfo($file['name'], PATHINFO_FILENAME);
    $base = preg_replace('/[^A-Za-z0-9_\- ]+/', '', $base);
    $base = trim(preg_replace('/\s+/', '-', $base), '-');
    if ($base === '') {
        $base = 'archivo';
    }

    $filename = $base . '.' . $ext;
    $i = 2;
    while (file_exists($dir . '/' . $filename)) {
        $filename = $base . '-' . $i . '.' . $ext;
        $i++;
    }

    $dest = $dir . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        fail(500, 'move_failed');
    }

    return $filename;
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

// ---- Participant (or admin): list resources (flat; folders are built client-side) ----
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
            'parent_id' => $r['parent_id'] ?? null,
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

// ---- Admin: create or update a resource (link, folder, or file) ----
if ($method === 'POST' && $action === 'save') {
    require_admin();

    $title = trim((string) ($_POST['title'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $type = trim((string) ($_POST['type'] ?? ''));
    $rawUrl = trim((string) ($_POST['url'] ?? ''));
    $id = trim((string) ($_POST['id'] ?? ''));
    $parentId = trim((string) ($_POST['parent_id'] ?? ''));
    $parentId = $parentId === '' ? null : $parentId;

    if ($title === '' || !in_array($type, TYPES, true)) {
        fail(422, 'invalid_input');
    }

    $resources = read_json_file(RESOURCES_FILE, []);

    // A folder can't be placed inside itself.
    if ($parentId !== null) {
        $parentExists = false;
        foreach ($resources as $r) {
            if ($r['id'] === $parentId && $r['type'] === 'folder') {
                $parentExists = true;
                break;
            }
        }
        if (!$parentExists || $parentId === $id) {
            fail(422, 'invalid_parent');
        }
    }

    if ($type === 'folder') {
        $url = '';
    } else {
        // Uploaded files already come back as a same-origin absolute path
        // (e.g. /files/uploads/xxx.pdf) from the upload endpoint; only
        // normalize/validate when it looks like an external URL.
        $url = str_starts_with($rawUrl, '/') ? $rawUrl : normalize_url($rawUrl);
        if ($url === '') {
            fail(422, 'invalid_url');
        }
    }

    if ($id !== '') {
        $found = false;
        foreach ($resources as &$r) {
            if ($r['id'] === $id) {
                $r['title'] = $title;
                $r['description'] = $description;
                $r['type'] = $type;
                $r['url'] = $url;
                $r['parent_id'] = $parentId;
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
            'parent_id' => $parentId,
            'order' => $maxOrder + 1,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];
    }

    write_resources($resources);
    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

// ---- Admin: delete a resource (and anything nested inside it, if a folder) ----
if ($method === 'POST' && $action === 'delete') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $resources = read_json_file(RESOURCES_FILE, []);

    $toDelete = [$id];
    $changed = true;
    while ($changed) {
        $changed = false;
        foreach ($resources as $r) {
            if (in_array($r['parent_id'] ?? null, $toDelete, true) && !in_array($r['id'], $toDelete, true)) {
                $toDelete[] = $r['id'];
                $changed = true;
            }
        }
    }

    $remaining = array_values(array_filter($resources, fn($r) => !in_array($r['id'], $toDelete, true)));
    write_resources($remaining);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: move a resource up/down among its siblings (same parent_id) ----
if ($method === 'POST' && $action === 'reorder') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $direction = $_POST['direction'] ?? '';

    $resources = read_json_file(RESOURCES_FILE, []);
    usort($resources, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));

    $target = null;
    foreach ($resources as $r) {
        if ($r['id'] === $id) {
            $target = $r;
            break;
        }
    }
    if ($target === null) {
        fail(404, 'not_found');
    }

    $siblingIndexes = [];
    foreach ($resources as $i => $r) {
        if (($r['parent_id'] ?? null) === ($target['parent_id'] ?? null)) {
            $siblingIndexes[] = $i;
        }
    }
    $pos = array_search($id, array_map(fn($i) => $resources[$i]['id'], $siblingIndexes), true);
    $swapPos = $direction === 'up' ? $pos - 1 : $pos + 1;

    if ($swapPos < 0 || $swapPos >= count($siblingIndexes)) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $indexA = $siblingIndexes[$pos];
    $indexB = $siblingIndexes[$swapPos];
    $orderA = $resources[$indexA]['order'] ?? $indexA;
    $orderB = $resources[$indexB]['order'] ?? $indexB;
    $resources[$indexA]['order'] = $orderB;
    $resources[$indexB]['order'] = $orderA;

    write_resources($resources);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: upload a file resource (keeps its original file name) ----
if ($method === 'POST' && $action === 'upload') {
    require_admin();
    $filename = store_uploaded_file($_FILES['file'] ?? null, UPLOAD_DIR, 25 * 1024 * 1024);
    echo json_encode(['ok' => true, 'url' => '/files/uploads/' . rawurlencode($filename)]);
    exit;
}

// ================= Guías (public downloads, no login required) =================

// ---- Admin: list guides ----
if ($method === 'GET' && $action === 'guides_list') {
    require_admin();
    $guides = read_json_file(GUIDES_FILE, []);
    usort($guides, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
    echo json_encode(['ok' => true, 'guides' => $guides]);
    exit;
}

// ---- Admin: upload a new guide (file + title), returns a public link ----
if ($method === 'POST' && $action === 'guides_upload') {
    require_admin();

    $title = trim((string) ($_POST['title'] ?? ''));
    if ($title === '') {
        fail(422, 'invalid_input');
    }

    $filename = store_uploaded_file($_FILES['file'] ?? null, GUIDES_DIR, 25 * 1024 * 1024);
    $url = '/files/guias/' . rawurlencode($filename);

    $guides = read_json_file(GUIDES_FILE, []);
    $guide = [
        'id' => bin2hex(random_bytes(8)),
        'title' => $title,
        'filename' => $filename,
        'url' => $url,
        'created_at' => date('c'),
    ];
    $guides[] = $guide;
    write_guides($guides);

    echo json_encode(['ok' => true, 'guide' => $guide]);
    exit;
}

// ---- Admin: delete a guide (removes the file too) ----
if ($method === 'POST' && $action === 'guides_delete') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $guides = read_json_file(GUIDES_FILE, []);

    foreach ($guides as $g) {
        if ($g['id'] === $id) {
            $path = GUIDES_DIR . '/' . basename($g['filename']);
            if (is_file($path)) {
                @unlink($path);
            }
            break;
        }
    }

    $remaining = array_values(array_filter($guides, fn($g) => $g['id'] !== $id));
    write_guides($remaining);
    echo json_encode(['ok' => true]);
    exit;
}

fail(400, 'unknown_action');
