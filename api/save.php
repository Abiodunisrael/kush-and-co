<?php
while (ob_get_level()) { ob_end_clean(); }
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (empty($_SESSION['kush_admin'])) {
    http_response_code(401);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || empty($body['file'])) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$allowed = ['outreaches.json', 'gallery.json', 'settings.json'];
$file = basename($body['file']);
if (!in_array($file, $allowed, true)) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'File not allowed.']);
    exit;
}

$dir = __DIR__ . '/../data/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

$path = $dir . $file;
$json = json_encode($body['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (file_put_contents($path, $json, LOCK_EX) === false) {
    http_response_code(500);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Could not write file.']);
    exit;
}

ob_end_clean();
echo json_encode(['success' => true]);