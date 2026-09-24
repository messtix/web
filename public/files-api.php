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
 * window per IP, keyed by a hashed IP + a namespace so different kinds
 * of login attempts don't share the same bucket.
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

function slugify($text) {
    $text = trim((string) $text);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT', $text);
        if ($converted !== false) {
            $text = $converted;
        }
    }
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}

/**
 * Validates an uploaded file against the shared allow-list and moves it
 * into $dir under a filesystem-safe (deduplicated) name, returning both
 * that stored name and the sanitized original name so callers can offer
 * a download that looks exactly like what was uploaded even when the
 * on-disk name had to change to avoid a collision. The 'original'
 * name returned keeps the exact uploaded file name (just stripped of
 * path separators/control characters) so a download can present it
 * byte-for-byte as it was uploaded, even though the file on disk uses
 * a filesystem-safe, deduplicated name.
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

    // True original name: just basename() to drop any path, strip
    // control characters/null bytes, and cap the length. Spaces and
    // accents are kept as-is.
    $trueOriginal = basename((string) $file['name']);
    $trueOriginal = preg_replace('/[\x00-\x1F\x7F]/u', '', $trueOriginal) ?? $trueOriginal;
    $trueOriginal = trim($trueOriginal);
    if ($trueOriginal === '' || $trueOriginal === '.' || $trueOriginal === '..') {
        $trueOriginal = 'archivo.' . $ext;
    }
    if (mb_strlen($trueOriginal) > 150) {
        $trueOriginal = mb_substr(pathinfo($trueOriginal, PATHINFO_FILENAME), 0, 140) . '.' . $ext;
    }

    // Filesystem-safe name used for the actual file on disk.
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

    return ['stored' => $filename, 'original' => $trueOriginal];
}

function unlocked_session_key($folderId) {
    return 'unlocked_folder_' . $folderId;
}

function is_folder_unlocked($folderId) {
    return is_admin_logged_in() || !empty($_SESSION[unlocked_session_key($folderId)]);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ---- Public: list resources inside a folder (root only ever shows folders the session has unlocked) ----
if ($method === 'GET' && $action === 'list') {
    $folderId = trim((string) ($_GET['folder_id'] ?? ''));
    $folderId = $folderId === '' ? null : $folderId;

    $resources = read_json_file(RESOURCES_FILE, []);

    if ($folderId !== null) {
        $folder = null;
        foreach ($resources as $r) {
            if ($r['id'] === $folderId && $r['type'] === 'folder') {
                $folder = $r;
                break;
            }
        }
        if ($folder === null) {
            fail(404, 'not_found');
        }
        if (!is_folder_unlocked($folderId)) {
            fail(401, 'locked');
        }
    }

    $items = array_values(array_filter($resources, fn($r) => ($r['parent_id'] ?? null) === $folderId));

    if ($folderId === null) {
        // The root only ever lists folders (links/files always live inside
        // one), and only the ones this session has actually unlocked —
        // nothing is visible here before logging in to at least one folder.
        $items = array_values(array_filter($items, fn($r) => $r['type'] === 'folder' && is_folder_unlocked($r['id'])));
    }

    usort($items, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));

    $summaries = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'title' => $r['title'],
            'description' => $r['description'] ?? '',
            'type' => $r['type'],
            'url' => $r['url'],
            'parent_id' => $r['parent_id'] ?? null,
            'has_password' => $r['type'] === 'folder' ? !empty($r['username']) : false,
        ];
    }, $items);

    echo json_encode(['ok' => true, 'resources' => $summaries]);
    exit;
}

// ---- Public: log in with a folder's username/password ----
// Unlike unlock_folder (used once already inside, to open a specific
// nested folder), this is the entry gate: it doesn't know which folder
// the visitor means, so it tries the credentials against every folder
// and unlocks whichever one(s) match — including any other folder that
// happens to share the exact same username/password.
if ($method === 'POST' && $action === 'login') {
    if (rate_limited(client_ip(), 'archivos_login', 10, 900)) {
        fail(429, 'rate_limited');
    }

    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $resources = read_json_file(RESOURCES_FILE, []);
    $matched = false;

    foreach ($resources as $r) {
        if (
            $r['type'] === 'folder'
            && !empty($r['username'])
            && hash_equals((string) $r['username'], $username)
            && isset($r['password_hash'])
            && password_verify($password, $r['password_hash'])
        ) {
            $_SESSION[unlocked_session_key($r['id'])] = true;
            $matched = true;
        }
    }

    if (!$matched) {
        fail(401, 'invalid_credentials');
    }

    echo json_encode(['ok' => true]);
    exit;
}

// ---- Public: unlock a nested password-protected folder while already browsing ----
if ($method === 'POST' && $action === 'unlock_folder') {
    if (rate_limited(client_ip(), 'folder_unlock', 15, 900)) {
        fail(429, 'rate_limited');
    }

    $folderId = trim((string) ($_POST['folder_id'] ?? ''));
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $resources = read_json_file(RESOURCES_FILE, []);
    $folder = null;
    foreach ($resources as $r) {
        if ($r['id'] === $folderId && $r['type'] === 'folder') {
            $folder = $r;
            break;
        }
    }
    if ($folder === null || empty($folder['username'])) {
        fail(404, 'not_found');
    }

    $validUser = hash_equals((string) $folder['username'], $username);
    $validPass = isset($folder['password_hash']) && password_verify($password, $folder['password_hash']);
    if (!$validUser || !$validPass) {
        fail(401, 'invalid_credentials');
    }

    // Unlock this folder, plus any other folder sharing the exact same
    // username/password — that shared pair is how a single set of
    // credentials is meant to grant access to more than one folder.
    foreach ($resources as $r) {
        if (
            $r['type'] === 'folder'
            && !empty($r['username'])
            && hash_equals((string) $r['username'], $username)
            && password_verify($password, $r['password_hash'])
        ) {
            $_SESSION[unlocked_session_key($r['id'])] = true;
        }
    }

    echo json_encode(['ok' => true]);
    exit;
}

// ---- Public: log out (clear every unlocked folder in this session) ----
if ($method === 'POST' && $action === 'lock_all') {
    foreach ($_SESSION as $key => $v) {
        if (str_starts_with($key, 'unlocked_folder_')) {
            unset($_SESSION[$key]);
        }
    }
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: list all resources (full flat tree, including credentials metadata) ----
if ($method === 'GET' && $action === 'admin_list') {
    require_admin();
    $resources = read_json_file(RESOURCES_FILE, []);
    usort($resources, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    // Never expose the password hash itself to the client.
    $safe = array_map(function ($r) {
        $copy = $r;
        $copy['has_password'] = !empty($r['username']);
        unset($copy['password_hash']);
        return $copy;
    }, $resources);
    echo json_encode(['ok' => true, 'resources' => $safe]);
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
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($title === '' || !in_array($type, TYPES, true)) {
        fail(422, 'invalid_input');
    }

    // Links and files must always live inside a folder; only folders are
    // allowed at the root, so the directory stays organized into folders.
    if ($type !== 'folder' && $parentId === null) {
        fail(422, 'parent_required');
    }

    // A folder without a username isn't a valid folder here: every folder
    // must be reachable only with its own username/password.
    if ($type === 'folder' && $username === '') {
        fail(422, 'username_required');
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
                if ($type === 'folder') {
                    $r['username'] = $username;
                    if ($password !== '') {
                        $r['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
                    } elseif (empty($r['password_hash'])) {
                        // A folder always needs a password; if none was set
                        // before, one must be provided now.
                        fail(422, 'password_required');
                    }
                } else {
                    unset($r['username'], $r['password_hash']);
                }
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
        $entry = [
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
        if ($type === 'folder') {
            if ($password === '') {
                fail(422, 'password_required');
            }
            $entry['username'] = $username;
            $entry['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
        }
        $resources[] = $entry;
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
    $stored = store_uploaded_file($_FILES['file'] ?? null, UPLOAD_DIR, 25 * 1024 * 1024);
    echo json_encode(['ok' => true, 'url' => '/files/uploads/' . rawurlencode($stored['stored'])]);
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

// ---- Admin: upload a new guide (file + title + custom link slug) ----
if ($method === 'POST' && $action === 'guides_upload') {
    require_admin();

    $title = trim((string) ($_POST['title'] ?? ''));
    $rawSlug = trim((string) ($_POST['slug'] ?? ''));
    if ($title === '') {
        fail(422, 'invalid_input');
    }

    $guides = read_json_file(GUIDES_FILE, []);

    $baseSlug = slugify($rawSlug !== '' ? $rawSlug : $title);
    if ($baseSlug === '') {
        $baseSlug = 'guia';
    }
    $slug = $baseSlug;
    $i = 2;
    while (in_array($slug, array_column($guides, 'slug'), true)) {
        $slug = $baseSlug . '-' . $i;
        $i++;
    }

    $stored = store_uploaded_file($_FILES['file'] ?? null, GUIDES_DIR, 25 * 1024 * 1024);

    $guide = [
        'id' => bin2hex(random_bytes(8)),
        'title' => $title,
        'slug' => $slug,
        'stored_filename' => $stored['stored'],
        'original_filename' => $stored['original'],
        'url' => '/guias/' . $slug,
        'created_at' => date('c'),
    ];
    $guides[] = $guide;
    write_guides($guides);

    echo json_encode(['ok' => true, 'guide' => $guide]);
    exit;
}

// ---- Admin: rename a guide's title/slug without touching the file ----
if ($method === 'POST' && $action === 'guides_update') {
    require_admin();
    $id = trim((string) ($_POST['id'] ?? ''));
    $title = trim((string) ($_POST['title'] ?? ''));
    $rawSlug = trim((string) ($_POST['slug'] ?? ''));

    if ($title === '') {
        fail(422, 'invalid_input');
    }

    $guides = read_json_file(GUIDES_FILE, []);
    $found = false;
    $newSlug = slugify($rawSlug !== '' ? $rawSlug : $title);
    if ($newSlug === '') {
        $newSlug = 'guia';
    }

    foreach ($guides as &$g) {
        if ($g['id'] === $id) {
            $slug = $newSlug;
            $i = 2;
            while (in_array($slug, array_column($guides, 'slug'), true) && $slug !== $g['slug']) {
                $slug = $newSlug . '-' . $i;
                $i++;
            }
            $g['title'] = $title;
            $g['slug'] = $slug;
            $g['url'] = '/guias/' . $slug;
            $found = true;
            break;
        }
    }
    unset($g);

    if (!$found) {
        fail(404, 'not_found');
    }

    write_guides($guides);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: delete a guide (removes the file too) ----
if ($method === 'POST' && $action === 'guides_delete') {
    require_admin();
    $id = $_POST['id'] ?? '';
    $guides = read_json_file(GUIDES_FILE, []);

    foreach ($guides as $g) {
        if ($g['id'] === $id) {
            $path = GUIDES_DIR . '/' . basename($g['stored_filename']);
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
