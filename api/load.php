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

$allowed = ['submissions.json'];
$file = basename($_GET['file'] ?? '');
if (!in_array($file, $allowed, true)) {
    ob_end_clean();
    echo json_encode([]);
    exit;
}

$path = __DIR__ . '/../data/' . $file;
if (!file_exists($path)) {
    ob_end_clean();
    echo json_encode([]);
    exit;
}

$content = file_get_contents($path);
ob_end_clean();
echo $content;