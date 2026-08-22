<?php
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

define('DATA_DIR', __DIR__ . '/data');
define('PROJECTS_FILE', DATA_DIR . '/portfolio.json');
define('UPLOAD_DIR', __DIR__ . '/img/portfolio');

const CATEGORIES = ['Desarrollo Web', 'Soporte/Mantenimiento', 'Automatización e IA'];

function fail($code, $error) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $error]);
    exit;
}

function is_logged_in() {
    // Shared session with blog-api.php: same login covers both admin areas.
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

function write_projects($projects) {
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
        return false;
    }
    $fp = fopen(PROJECTS_FILE, 'c+');
    if (!$fp) {
        return false;
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($projects, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
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
    return $text !== '' ? $text : 'proyecto';
}

function slug_taken($slug, $projects, $excludeId) {
    foreach ($projects as $p) {
        if ($p['slug'] === $slug && $p['id'] !== $excludeId) {
            return true;
        }
    }
    return false;
}

function unique_slug($base, $projects, $excludeId = null) {
    $slug = $base;
    $i = 2;
    while (slug_taken($slug, $projects, $excludeId)) {
        $slug = $base . '-' . $i;
        $i++;
    }
    return $slug;
}

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

// ---- Public: list published projects ----
if ($method === 'GET' && $action === 'list') {
    $projects = read_json_file(PROJECTS_FILE, []);
    $published = array_values(array_filter($projects, fn($p) => !empty($p['published'])));
    usort($published, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

    $category = trim((string) ($_GET['category'] ?? ''));
    if ($category !== '') {
        $published = array_values(array_filter($published, fn($p) => $p['category'] === $category));
    }

    $summaries = array_map(function ($p) {
        return [
            'slug' => $p['slug'],
            'name' => $p['name'],
            'company' => $p['company'],
            'category' => $p['category'],
            'description' => $p['description'],
            'url' => $p['url'] ?? '',
            'cover_image' => $p['cover_image'] ?? '',
        ];
    }, $published);

    echo json_encode(['ok' => true, 'projects' => $summaries, 'categories' => CATEGORIES]);
    exit;
}

// ---- Public: get single published project ----
if ($method === 'GET' && $action === 'get') {
    $slug = $_GET['slug'] ?? '';
    $projects = read_json_file(PROJECTS_FILE, []);
    foreach ($projects as $p) {
        if ($p['slug'] === $slug && !empty($p['published'])) {
            echo json_encode(['ok' => true, 'project' => $p]);
            exit;
        }
    }
    fail(404, 'not_found');
}

// ---- Admin: list all projects (draft + published) ----
if ($method === 'GET' && $action === 'admin_list') {
    require_login();
    $projects = read_json_file(PROJECTS_FILE, []);
    usort($projects, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
    echo json_encode(['ok' => true, 'projects' => $projects, 'categories' => CATEGORIES]);
    exit;
}

// ---- Admin: get single project (any state) by id ----
if ($method === 'GET' && $action === 'admin_get') {
    require_login();
    $id = $_GET['id'] ?? '';
    $projects = read_json_file(PROJECTS_FILE, []);
    foreach ($projects as $p) {
        if ($p['id'] === $id) {
            echo json_encode(['ok' => true, 'project' => $p]);
            exit;
        }
    }
    fail(404, 'not_found');
}

// ---- Admin: create or update a project ----
if ($method === 'POST' && $action === 'save') {
    require_login();

    $name = trim((string) ($_POST['name'] ?? ''));
    $client = trim((string) ($_POST['client'] ?? ''));
    $company = trim((string) ($_POST['company'] ?? ''));
    $url = normalize_url($_POST['url'] ?? '');
    $category = trim((string) ($_POST['category'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $coverImage = trim((string) ($_POST['cover_image'] ?? ''));
    $published = !empty($_POST['published']) && $_POST['published'] !== 'false';
    $id = trim((string) ($_POST['id'] ?? ''));

    if ($name === '' || !in_array($category, CATEGORIES, true)) {
        fail(422, 'invalid_input');
    }

    $projects = read_json_file(PROJECTS_FILE, []);

    if ($id !== '') {
        $found = false;
        foreach ($projects as &$p) {
            if ($p['id'] === $id) {
                $baseSlug = slugify($name);
                $p['name'] = $name;
                $p['slug'] = unique_slug($baseSlug, $projects, $id);
                $p['client'] = $client;
                $p['company'] = $company;
                $p['url'] = $url;
                $p['category'] = $category;
                $p['description'] = $description;
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
        $baseSlug = slugify($name);
        $projects[] = [
            'id' => $id,
            'name' => $name,
            'slug' => unique_slug($baseSlug, $projects),
            'client' => $client,
            'company' => $company,
            'url' => $url,
            'category' => $category,
            'description' => $description,
            'cover_image' => $coverImage,
            'published' => $published,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];
    }

    write_projects($projects);
    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

// ---- Admin: delete a project ----
if ($method === 'POST' && $action === 'delete') {
    require_login();
    $id = $_POST['id'] ?? '';
    $projects = read_json_file(PROJECTS_FILE, []);
    $remaining = array_values(array_filter($projects, fn($p) => $p['id'] !== $id));
    write_projects($remaining);
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

    echo json_encode(['ok' => true, 'url' => '/img/portfolio/' . $filename]);
    exit;
}

fail(400, 'unknown_action');
