<?php
// Serves a guide's file under its original uploaded filename, regardless
// of the (deduplicated) name it's actually stored under on disk, and
// regardless of the custom /guias/<slug> link used to reach it.

define('DATA_DIR', __DIR__ . '/data');
define('GUIDES_FILE', DATA_DIR . '/guides.json');
define('GUIDES_DIR', __DIR__ . '/files/guias');

$slug = trim((string) ($_GET['slug'] ?? ''));
if ($slug === '') {
    http_response_code(404);
    exit('No encontrado.');
}

$raw = file_exists(GUIDES_FILE) ? file_get_contents(GUIDES_FILE) : '[]';
$guides = json_decode($raw, true) ?: [];

$guide = null;
foreach ($guides as $g) {
    if (($g['slug'] ?? '') === $slug) {
        $guide = $g;
        break;
    }
}

if ($guide === null) {
    http_response_code(404);
    exit('Este enlace ya no está disponible.');
}

$path = GUIDES_DIR . '/' . basename($guide['stored_filename']);
if (!is_file($path)) {
    http_response_code(404);
    exit('Este enlace ya no está disponible.');
}

$downloadName = $guide['original_filename'] ?? basename($path);

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $path) ?: 'application/octet-stream';
finfo_close($finfo);

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($path));
header('Content-Disposition: attachment; filename="' . str_replace('"', '', $downloadName) . '"');
header('X-Content-Type-Options: nosniff');
readfile($path);
