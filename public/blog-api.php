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
define('LOGIN_ATTEMPTS_FILE', DATA_DIR . '/login-attempts.json');
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

function write_admin($admin) {
    file_put_contents(ADMIN_FILE, json_encode($admin, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * Self-bootstrapping account: data/admin.json is intentionally never
 * shipped with the site build, so that re-uploading the static files
 * (index.html, assets/, etc.) on top of an existing deployment can
 * never clobber the real password/display name or the published
 * posts sitting in data/. If admin.json is missing (fresh install),
 * create it once with the default credentials.
 */
function ensure_admin_exists() {
    if (file_exists(ADMIN_FILE)) {
        return;
    }
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR, 0755, true);
    }
    write_admin([
        'username' => 'messtix',
        'password_hash' => password_hash('Messtix-Blog-2026', PASSWORD_BCRYPT),
        'display_name' => 'María Sánchez',
    ]);
}

/**
 * Login attempt rate limiting: max 8 tries per 15 minutes per IP.
 * Fails open (allows the attempt) if the store can't be read/written.
 */
function login_rate_limited($ip) {
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
    $window = 900; // 15 minutes
    $limit = 8;
    $key = hash('sha256', $ip);

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

/**
 * Whitelist-based HTML sanitizer for rich text editor output.
 * Strips anything not explicitly allowed (scripts, event handlers,
 * javascript: URLs, unknown tags/attributes/CSS properties).
 */
function sanitize_html($html) {
    $html = trim((string) $html);
    if ($html === '') {
        return '';
    }

    $allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'];
    $allowedAttrs = [
        'a' => ['href', 'target', 'rel'],
        'span' => ['style'],
        'p' => ['style'],
        'li' => ['style'],
    ];
    $allowedStyleProps = ['color', 'background-color', 'text-align', 'font-size', 'font-family'];

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML(
        '<?xml encoding="utf-8"?><div>' . $html . '</div>',
        LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
    );
    libxml_clear_errors();

    $wrapper = $dom->getElementsByTagName('div')->item(0);
    if (!$wrapper) {
        return '';
    }
    sanitize_node($wrapper, $allowedTags, $allowedAttrs, $allowedStyleProps);

    $out = '';
    foreach (iterator_to_array($wrapper->childNodes) as $child) {
        $out .= $dom->saveHTML($child);
    }
    return $out;
}

function sanitize_style($style, $allowedProps) {
    $out = [];
    foreach (explode(';', $style) as $decl) {
        $parts = explode(':', $decl, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $prop = strtolower(trim($parts[0]));
        $val = trim($parts[1]);
        if (
            in_array($prop, $allowedProps, true)
            && stripos($val, 'expression') === false
            && stripos($val, 'javascript') === false
            && stripos($val, 'url(') === false
        ) {
            $out[] = "$prop:$val";
        }
    }
    return implode(';', $out);
}

function sanitize_node($node, $allowedTags, $allowedAttrs, $allowedStyleProps) {
    $toRemove = [];
    foreach (iterator_to_array($node->childNodes) as $child) {
        if ($child->nodeType === XML_ELEMENT_NODE) {
            $tag = strtolower($child->nodeName);

            if (!in_array($tag, $allowedTags, true)) {
                if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg'], true)) {
                    $toRemove[] = $child;
                    continue;
                }
                // Unknown but harmless tag (e.g. div from a paste): unwrap, keep children/text.
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $toRemove[] = $child;
                continue;
            }

            if ($tag === 'br') {
                // Content pasted from Word often carries literal <br> tags at
                // each original line-wrap position. Rendered in a narrower
                // column those land mid-word and cut it in half. A <br>
                // directly between two word characters (no space, no
                // punctuation) is almost certainly one of these paste
                // artifacts, not an intentional line break.
                $prevChar = ($child->previousSibling && $child->previousSibling->nodeType === XML_TEXT_NODE)
                    ? mb_substr($child->previousSibling->textContent, -1)
                    : '';
                $nextChar = ($child->nextSibling && $child->nextSibling->nodeType === XML_TEXT_NODE)
                    ? mb_substr($child->nextSibling->textContent, 0, 1)
                    : '';
                if (preg_match('/[\p{L}\p{N}]/u', $prevChar) && preg_match('/[\p{L}\p{N}]/u', $nextChar)) {
                    $space = $child->ownerDocument->createTextNode(' ');
                    $node->replaceChild($space, $child);
                    continue;
                }
            }

            if ($child->hasAttributes()) {
                $attrsToRemove = [];
                foreach (iterator_to_array($child->attributes) as $attr) {
                    $name = strtolower($attr->name);
                    $allowed = $allowedAttrs[$tag] ?? [];
                    if (!in_array($name, $allowed, true)) {
                        $attrsToRemove[] = $attr->name;
                        continue;
                    }
                    if ($name === 'href' && stripos(trim($attr->value), 'javascript:') === 0) {
                        $attrsToRemove[] = $attr->name;
                    }
                    if ($name === 'style') {
                        $child->setAttribute('style', sanitize_style($attr->value, $allowedStyleProps));
                    }
                }
                foreach ($attrsToRemove as $an) {
                    $child->removeAttribute($an);
                }
            }

            if ($tag === 'a') {
                $child->setAttribute('target', '_blank');
                $child->setAttribute('rel', 'noopener noreferrer');
            }

            sanitize_node($child, $allowedTags, $allowedAttrs, $allowedStyleProps);
        } elseif ($child->nodeType !== XML_TEXT_NODE) {
            $toRemove[] = $child;
        }
    }
    foreach ($toRemove as $r) {
        if ($r->parentNode) {
            $r->parentNode->removeChild($r);
        }
    }
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

ensure_admin_exists();

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
            'author' => $p['author'] ?? '',
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
    $displayName = '';
    if (is_logged_in()) {
        $admin = read_json_file(ADMIN_FILE, []);
        $displayName = $admin['display_name'] ?? '';
    }
    echo json_encode(['ok' => true, 'loggedIn' => is_logged_in(), 'displayName' => $displayName]);
    exit;
}

// ---- Auth: login ----
if ($method === 'POST' && $action === 'login') {
    if (login_rate_limited(client_ip())) {
        fail(429, 'rate_limited');
    }

    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $admin = read_json_file(ADMIN_FILE, null);

    $validUser = $admin && isset($admin['username']) && strcasecmp($admin['username'], $username) === 0;
    $validPass = $admin && isset($admin['password_hash']) && password_verify($password, $admin['password_hash']);

    if (!$validUser || !$validPass) {
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
    write_admin($admin);
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Admin: update display name (shown as post author) ----
if ($method === 'POST' && $action === 'update_display_name') {
    require_login();
    $name = trim((string) ($_POST['display_name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 80) {
        fail(422, 'invalid_name');
    }
    $admin = read_json_file(ADMIN_FILE, []);
    $admin['display_name'] = $name;
    write_admin($admin);
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
    $content = sanitize_html($_POST['content'] ?? '');
    $category = trim((string) ($_POST['category'] ?? ''));
    $coverImage = trim((string) ($_POST['cover_image'] ?? ''));
    $author = trim((string) ($_POST['author'] ?? ''));
    $published = !empty($_POST['published']) && $_POST['published'] !== 'false';
    $id = trim((string) ($_POST['id'] ?? ''));

    if ($title === '' || trim(strip_tags($content)) === '') {
        fail(422, 'invalid_input');
    }

    if ($author === '') {
        $admin = read_json_file(ADMIN_FILE, []);
        $author = $admin['display_name'] ?? 'Messtix';
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
                $p['author'] = $author;
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
            'author' => $author,
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
