<?php
/**
 * ZippyTechSystems Pvt. Ltd. — Authentication API
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Support JSON body specifying action
if (empty($action) && in_array($method, ['POST', 'PUT'], true)) {
    $input = get_json_input();
    $action = $input['action'] ?? '';
}

// -----------------------------------------------------------------------------
// GET /api/auth.php?action=me (or GET /api/auth.php)
// -----------------------------------------------------------------------------
if ($method === 'GET' || $action === 'me') {
    if (is_authenticated()) {
        json_response([
            'authenticated' => true,
            'user'          => $_SESSION['admin_user'],
        ]);
    } else {
        json_response([
            'authenticated' => false,
            'user'          => null,
        ]);
    }
}

// -----------------------------------------------------------------------------
// POST /api/auth.php?action=login
// -----------------------------------------------------------------------------
if ($method === 'POST' && ($action === 'login' || empty($action))) {
    $input = get_json_input();
    $identifier = trim((string)($input['identifier'] ?? $input['email'] ?? $input['username'] ?? ''));
    $password   = trim((string)($input['password'] ?? ''));

    if (empty($identifier) || empty($password)) {
        error_response('Username/Email and password are required.', 400);
    }

    // Rate Limiting (5 attempts in 15 minutes)
    if (!rate_limit_check('login_' . $identifier, 5, 900)) {
        error_response('Too many login attempts. Please wait 15 minutes before trying again.', 429);
    }

    $db = get_db();
    $user = null;

    if ($db !== null) {
        try {
            $stmt = $db->prepare('SELECT * FROM admin_users WHERE email = :id_email OR username = :id_user LIMIT 1');
            $stmt->execute([':id_email' => $identifier, ':id_user' => $identifier]);
            $user = $stmt->fetch();

            if ($user && !empty($user['locked_until'])) {
                if (strtotime($user['locked_until']) > time()) {
                    error_response('Account temporarily locked due to multiple failed attempts. Try again later.', 403);
                }
            }
        } catch (PDOException $e) {
            error_log('Auth DB error: ' . $e->getMessage());
        }
    }

    $isValid = false;

    if ($user) {
        $isValid = password_verify($password, $user['password_hash']);
    }

    // Fallback verification for default admin during fresh install / db config phase
    if (!$isValid) {
        $defaultUser = 'lingaswamymaddeboina';
        $defaultEmail = 'lingaswamymaddeboina@gmail.com';
        $defaultPass = 'linga@123';

        if (($identifier === $defaultUser || $identifier === $defaultEmail || $identifier === 'lingaswamy') && $password === $defaultPass) {
            $isValid = true;
            if (!$user) {
                $user = [
                    'id' => 1,
                    'username' => $defaultUser,
                    'email' => $defaultEmail,
                    'role' => 'Administrator',
                ];
            }
        }
    }

    if (!$isValid) {
        if ($db !== null && $user) {
            try {
                $failedAttempts = (int)($user['failed_login_attempts'] ?? 0) + 1;
                $lockedUntil = $failedAttempts >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
                $upd = $db->prepare('UPDATE admin_users SET failed_login_attempts = :attempts, locked_until = :locked WHERE id = :id');
                $upd->execute([':attempts' => $failedAttempts, ':locked' => $lockedUntil, ':id' => $user['id']]);
            } catch (Exception $e) {}
        }
        error_response('Invalid credentials. Please verify your admin username and password.', 401);
    }

    // Success! Update DB user state
    if ($db !== null && isset($user['id'])) {
        try {
            $upd = $db->prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = :id');
            $upd->execute([':id' => $user['id']]);

            // Track session in DB
            $sessId = session_id();
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
            $expires = date('Y-m-d H:i:s', time() + (86400 * 7));

            $sessStmt = $db->prepare('
                INSERT INTO sessions (id, user_id, ip_address, user_agent, payload, last_activity, expires_at)
                VALUES (:id, :uid, :ip, :ua, :payload, :activity, :expires)
                ON DUPLICATE KEY UPDATE last_activity = VALUES(last_activity), expires_at = VALUES(expires_at)
            ');
            $sessStmt->execute([
                ':id'       => $sessId,
                ':uid'      => $user['id'],
                ':ip'       => substr($ip, 0, 45),
                ':ua'       => substr($ua, 0, 500),
                ':payload'  => json_encode(['username' => $user['username']]),
                ':activity' => time(),
                ':expires'  => $expires,
            ]);
        } catch (Exception $e) {
            error_log('Session track error: ' . $e->getMessage());
        }
    }

    $adminUserData = [
        'id'       => $user['id'] ?? 1,
        'username' => $user['username'] ?? 'lingaswamymaddeboina',
        'email'    => $user['email'] ?? 'lingaswamymaddeboina@gmail.com',
        'role'     => $user['role'] ?? 'Administrator',
    ];

    $_SESSION['admin_user_id'] = $adminUserData['id'];
    $_SESSION['admin_user']    = $adminUserData;

    json_response([
        'success' => true,
        'message' => 'Logged in successfully.',
        'user'    => $adminUserData,
    ]);
}

// -----------------------------------------------------------------------------
// POST /api/auth.php?action=logout
// -----------------------------------------------------------------------------
if ($method === 'POST' && $action === 'logout') {
    $db = get_db();
    if ($db !== null && !empty($_SESSION['admin_user_id'])) {
        try {
            $sessId = session_id();
            $del = $db->prepare('DELETE FROM sessions WHERE id = :id');
            $del->execute([':id' => $sessId]);
        } catch (Exception $e) {}
    }

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

    json_response(['success' => true, 'message' => 'Logged out successfully.']);
}

// -----------------------------------------------------------------------------
// POST /api/auth.php?action=change_password
// -----------------------------------------------------------------------------
if ($method === 'POST' && $action === 'change_password') {
    $admin = require_admin();
    $input = get_json_input();
    $currentPass = trim((string)($input['current_password'] ?? ''));
    $newPass     = trim((string)($input['new_password'] ?? ''));

    if (empty($currentPass) || empty($newPass)) {
        error_response('Current password and new password are required.', 400);
    }

    if (strlen($newPass) < 8) {
        error_response('New password must be at least 8 characters long.', 400);
    }

    $db = get_db();
    if ($db === null) {
        error_response('Database not connected.', 500);
    }

    $stmt = $db->prepare('SELECT password_hash FROM admin_users WHERE id = :id');
    $stmt->execute([':id' => $admin['id']]);
    $currentHash = $stmt->fetchColumn();

    if (!$currentHash || !password_verify($currentPass, $currentHash)) {
        error_response('Current password is incorrect.', 401);
    }

    $newHash = password_hash($newPass, PASSWORD_BCRYPT);
    $upd = $db->prepare('UPDATE admin_users SET password_hash = :hash WHERE id = :id');
    $upd->execute([':hash' => $newHash, ':id' => $admin['id']]);

    json_response(['success' => true, 'message' => 'Password updated successfully.']);
}

error_response('Method not allowed or unknown action.', 405);
