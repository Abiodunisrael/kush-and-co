<?php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['kush_admin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
    exit;
}

if (empty($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file.']);
    exit;
}

$f = $_FILES['image'];
$maxSize = 3 * 1024 * 1024;
if ($f['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'File too large (max 3MB).']);
    exit;
}

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$mime = mime_content_type($f['tmp_name']);
if (!isset($allowed[$mime])) {
    echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, WEBP, GIF allowed.']);
    exit;
}

$dir = __DIR__ . '/../uploads/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

$name = 'img-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
$dest = $dir . $name;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
    echo json_encode(['success' => false, 'message' => 'Could not save file.']);
    exit;
}

echo json_encode(['success' => true, 'url' => 'uploads/' . $name]);