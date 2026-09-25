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
$submittedAt = trim($body['submittedAt'] ?? '');
if ($submittedAt === '') {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Missing ID.']);
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
        $row['certificate'] = '';
        $found = true;
        break;
    }
}
unset($row);

if (!$found) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Not found.']);
    exit;
}

file_put_contents($path, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

ob_end_clean();
echo json_encode(['success' => true]);