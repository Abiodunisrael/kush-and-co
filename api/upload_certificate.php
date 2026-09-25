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

if (empty($_FILES['image'])) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'No file.']);
    exit;
}

$submittedAt = trim($_POST['submittedAt'] ?? '');
if ($submittedAt === '') {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Missing submission ID.']);
    exit;
}

$f = $_FILES['image'];
$maxSize = 3 * 1024 * 1024;
if ($f['size'] > $maxSize) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'File too large (max 3MB).']);
    exit;
}

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mime = function_exists('mime_content_type') ? mime_content_type($f['tmp_name']) : ($f['type'] ?? '');
if (!isset($allowed[$mime])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, WEBP allowed.']);
    exit;
}

$dir = __DIR__ . '/../uploads/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

$name = 'cert-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
$dest = $dir . $name;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Could not save file.']);
    exit;
}

$path = __DIR__ . '/../data/submissions.json';
if (!file_exists($path)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'No submissions file.']);
    exit;
}

$list = json_decode(file_get_contents($path), true) ?: [];
$found = false;

foreach ($list as &$row) {
    if (($row['submittedAt'] ?? '') === $submittedAt) {
        if (!empty($row['certificate'])) {
            $old = __DIR__ . '/../' . $row['certificate'];
            if (is_file($old)) @unlink($old);
        }
        $row['certificate'] = 'uploads/' . $name;
        $found = true;
        break;
    }
}
unset($row);

if (!$found) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Submission not found.']);
    exit;
}

file_put_contents($path, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

ob_end_clean();
echo json_encode(['success' => true, 'url' => 'uploads/' . $name]);