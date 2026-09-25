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
if (!is_array($body)) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid body.']);
    exit;
}

$target = trim($body['submittedAt'] ?? '');
$status = trim($body['status'] ?? '');

$allowed = ['pending', 'renewed'];
if ($target === '' || !in_array($status, $allowed, true)) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid params.']);
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
    if (($row['submittedAt'] ?? '') === $target) {
        $row['status'] = $status;
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
echo json_encode(['success' => true]);