<?php
while (ob_get_level()) { ob_end_clean(); }
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const ADMIN_PASSWORD = 'CHANGE_ME_ON_SERVER';

$action = $_GET['action'] ?? '';

/* ---------- LOGIN ---------- */
if ($action === 'login') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $pw = (string)($body['password'] ?? '');

    if (hash_equals(ADMIN_PASSWORD, $pw)) {
        $_SESSION['kush_admin'] = true;
        $_SESSION['kush_login_at'] = time();
        $out = ['success' => true];
    } else {
        http_response_code(401);
        $out = ['success' => false, 'message' => 'Incorrect password.'];
    }

    ob_end_clean();
    echo json_encode($out);
    exit;
}

/* ---------- CHECK ---------- */
if ($action === 'check') {
    $out = [
        'authenticated' => !empty($_SESSION['kush_admin']),
        'sessionId'     => session_id(),
    ];
    ob_end_clean();
    echo json_encode($out);
    exit;
}

/* ---------- LOGOUT ---------- */
if ($action === 'logout') {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();

    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Logged out.']);
    exit;
}

/* ---------- FALLBACK ---------- */
http_response_code(400);
ob_end_clean();
echo json_encode(['success' => false, 'message' => 'Unknown action.']);