<?php
while (ob_get_level()) { ob_end_clean(); }
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid request body.']);
    exit;
}

$entry = [
    'name'        => trim($body['name']     ?? ''),
    'license'     => trim($body['license']  ?? ''),
    'email'       => trim($body['email']    ?? ''),
    'whatsapp'    => trim($body['whatsapp'] ?? ''),
    'status'      => 'pending',
    'public'      => false,
    'certificate' => '',
    'submittedAt' => $body['submittedAt']   ?? date('c'),
    'ip'          => $_SERVER['REMOTE_ADDR'] ?? '',
];

if ($entry['name'] === '' || $entry['license'] === '' || $entry['email'] === '' || $entry['whatsapp'] === '') {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit;
}

if (!filter_var($entry['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

if (!preg_match('/^[\d\s()+-]{7,20}$/', $entry['whatsapp'])) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid WhatsApp number.']);
    exit;
}

$dir = __DIR__ . '/../data/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

$path = $dir . 'submissions.json';

$existing = [];
if (file_exists($path)) {
    $raw = file_get_contents($path);
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) $existing = $decoded;
}

$existing[] = $entry;

$json = json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if (file_put_contents($path, $json, LOCK_EX) === false) {
    http_response_code(500);
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Could not save submission.']);
    exit;
}

ob_end_clean();
echo json_encode(['success' => true]);