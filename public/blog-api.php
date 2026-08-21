<?php
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

define('DATA_DIR', __DIR__ . '/data');
define('POSTS_FILE', DATA_DIR . '/posts.json');
define('ADMIN_FILE', DATA_DIR . '/admin.json');
define('UPLOAD_DIR', __DIR__ . '/img/blog');

function fail($code, $error) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $error]);
    exit;
}

function is_logged_in() {
    return !empty($_SESSION['admin']);
}

function require_login() {
    if (!is_logged_in()) {
        fail(401, 'unauthorized');
    }
}

function read_json_file($path, $default) {
    if (!file_exists($path)) {
        return $default;
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    return $data === null ? $default : $data;
}

function write_posts($posts) {
    $fp = fopen(POSTS_FILE, 'c+');
    if (!$fp) {
        return false;
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
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
    $text = trim($text, '-');
    return $text !== '' ? $text : 'post';
}

function slug_taken($slug, $posts, $excludeId) {
    foreach ($posts as $p) {
        if ($p['slug'] === $slug && $p['id'] !== $excludeId) {
            return true;
        }
    }
    return false;
}

function unique_slug($base, $posts, $excludeId = null) {
    $slug = $base;
    $i = 2;
    while (slug_taken($slug, $posts, $excludeId)) {
        $slug = $base . '-' . $i;
        $i++;
    }
    return $slug;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ---- Public: list published posts ----
if ($method === 'GET' && $action === 'list') {
    $posts = read_json_file(POSTS_FILE, []);
    $published = array_values(array_filter($posts, fn($p) => !empty($p['published'])));
    usort($published, fn($a, $b) => strcmp($b['date'], $a['date']));
    $summaries = array_map(function ($p) {
        return [
            'slug' => $p['slug'],
            'title' => $p['title'],
            'excerpt' => $p['excerpt'],
            'category' => $p['category'],
            'date' => $p['date'],
            'cover_image' => $p['cover_image'] ?? '',
        ];
    }, $published);
    echo json_encode(['ok' => true, 'posts' => $summaries]);
    exit;
}

// ---- Public: get single published post ----
if ($method === 'GET' && $action === 'get') {
    $slug = $_GET['slug'] ?? '';
    $posts = read_json_file(POSTS_FILE, []);
    foreach ($posts as $p) {
        if ($p['slug'] === $slug && !empty($p['published'])) {
            echo json_encode(['ok' => true, 'post' => $p]);
            exit;
        }
    }
    fail(404, 'not_found');
}

// ---- Auth: session check ----
if ($method === 'GET' && $action === 'session') {
    echo json_encode(['ok' => true, 'loggedIn' => is_logged_in()]);
    exit;
}

// ---- Auth: login ----
if ($method === 'POST' && $action === 'login') {
    $password = $_POST['password'] ?? '';
    $admin = read_json_file(ADMIN_FILE, null);
    if (!$admin || !isset($admin['password_hash']) || !password_verify($password, $admin['password_hash'])) {
        fail(401, 'invalid_credentials');
    }
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Auth: logout ----
if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Auth: change password ----
if ($method === 'POST' && $action === 'change_password') {
    require_login();
    $current = $_POST['current'] ?? '';
    $new = $_POST['new'] ?? '';
    $admin = read_json_file(ADMIN_FILE, null);
    if (!$admin || !password_verify($current, $admin['password_hash'])) {
        fail(401, 'invalid_current_password');
    }
    if (mb_strlen($new) < 8) {
        fail(422, 'password_too_short');
    }
    $admin['password_hash'] = password_hash($new, PASSWORD_BCRYPT);
    file_put_contents(ADMIN_FILE, json_encode($admin));
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: list all posts (draft + published) ----
if ($method === 'GET' && $action === 'admin_list') {
    require_login();
    $posts = read_json_file(POSTS_FILE, []);
    usort($posts, fn($a, $b) => strcmp($b['date'], $a['date']));
    echo json_encode(['ok' => true, 'posts' => $posts]);
    exit;
}

// ---- Admin: get single post (any state) by id ----
if ($method === 'GET' && $action === 'admin_get') {
    require_login();
    $id = $_GET['id'] ?? '';
    $posts = read_json_file(POSTS_FILE, []);
    foreach ($posts as $p) {
        if ($p['id'] === $id) {
            echo json_encode(['ok' => true, 'post' => $p]);
            exit;
        }
    }
    fail(404, 'not_found');
}

// ---- Admin: create or update a post ----
if ($method === 'POST' && $action === 'save') {
    require_login();

    $title = trim((string) ($_POST['title'] ?? ''));
    $excerpt = trim((string) ($_POST['excerpt'] ?? ''));
    $content = trim((string) ($_POST['content'] ?? ''));
    $category = trim((string) ($_POST['category'] ?? ''));
    $coverImage = trim((string) ($_POST['cover_image'] ?? ''));
    $published = !empty($_POST['published']) && $_POST['published'] !== 'false';
    $id = trim((string) ($_POST['id'] ?? ''));

    if ($title === '' || $content === '') {
        fail(422, 'invalid_input');
    }

    $posts = read_json_file(POSTS_FILE, []);

    if ($id !== '') {
        $found = false;
        foreach ($posts as &$p) {
            if ($p['id'] === $id) {
                $baseSlug = slugify($title);
                $p['title'] = $title;
                $p['slug'] = unique_slug($baseSlug, $posts, $id);
                $p['excerpt'] = $excerpt;
                $p['content'] = $content;
                $p['category'] = $category;
                $p['cover_image'] = $coverImage;
                $p['published'] = $published;
                $p['updated_at'] = date('c');
                $found = true;
                break;
            }
        }
        unset($p);
        if (!$found) {
            fail(404, 'not_found');
        }
    } else {
        $id = bin2hex(random_bytes(8));
        $baseSlug = slugify($title);
        $posts[] = [
            'id' => $id,
            'title' => $title,
            'slug' => unique_slug($baseSlug, $posts),
            'excerpt' => $excerpt,
            'content' => $content,
            'category' => $category,
            'cover_image' => $coverImage,
            'published' => $published,
            'date' => date('Y-m-d'),
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];
    }

    write_posts($posts);
    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

// ---- Admin: delete a post ----
if ($method === 'POST' && $action === 'delete') {
    require_login();
    $id = $_POST['id'] ?? '';
    $posts = read_json_file(POSTS_FILE, []);
    $remaining = array_values(array_filter($posts, fn($p) => $p['id'] !== $id));
    write_posts($remaining);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: upload a cover image ----
if ($method === 'POST' && $action === 'upload_image') {
    require_login();

    if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        fail(422, 'upload_failed');
    }

    $file = $_FILES['image'];
    $maxBytes = 5 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        fail(422, 'file_too_large');
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
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

    echo json_encode(['ok' => true, 'url' => '/img/blog/' . $filename]);
    exit;
}

fail(400, 'unknown_action');
