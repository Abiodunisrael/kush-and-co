<?php
while (ob_get_level()) { ob_end_clean(); }
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$path = __DIR__ . '/../data/submissions.json';
if (!file_exists($path)) {
    ob_end_clean();
    echo json_encode([]);
    exit;
}

$list = json_decode(file_get_contents($path), true) ?: [];
if (!is_array($list)) $list = [];

$out = [];
foreach ($list as $row) {
    if (empty($row['public'])) continue;
    if (($row['status'] ?? '') !== 'renewed') continue;

    $name = trim($row['name'] ?? '');
    $parts = preg_split('/\s+/', $name);
    if (count($parts) >= 2) {
        $safe = $parts[0] . ' ' . strtoupper(mb_substr($parts[1], 0, 1)) . '.';
    } else {
        $safe = $parts[0] ?: 'Nurse';
    }

    $out[] = [
        'name'        => $safe,
        'renewedAt'   => $row['submittedAt'] ?? '',
        'certificate' => $row['certificate'] ?? '',
    ];
}

usort($out, function($a, $b) {
    return strtotime($b['renewedAt']) - strtotime($a['renewedAt']);
});

ob_end_clean();
echo json_encode($out);
exit;