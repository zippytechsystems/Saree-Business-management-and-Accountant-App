<?php
/**
 * ZippyTechSystems Pvt. Ltd. — API Bootstrap & Middleware
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

// Set strict error handling
error_reporting(E_ALL);

// Load Configuration
$configFile = __DIR__ . '/config.php';
$exampleFile = __DIR__ . '/config.example.php';

if (file_exists($configFile)) {
    $config = require $configFile;
} elseif (file_exists($exampleFile)) {
    $config = require $exampleFile;
} else {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Configuration file missing.'], JSON_UNESCAPED_SLASHES);
    exit;
}

// Timezone
date_default_timezone_set($config['app']['timezone'] ?? 'Asia/Kolkata');

// Display Errors based on debug setting
if (!empty($config['app']['debug'])) {
    ini_set('display_errors', '1');
} else {
    ini_set('display_errors', '0');
}

// -----------------------------------------------------------------------------
// CORS & Security Headers
// -----------------------------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['app']['allowed_origins'] ?? [
    'https://zippysoftwares.in',
    'https://www.zippysoftwares.in',
    'http://localhost:5173',
    'http://localhost:3000',
];

if (!empty($origin) && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} elseif (empty($origin)) {
    // Same-origin request
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');

// Strict Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -----------------------------------------------------------------------------
// Session Management (Secure HttpOnly SameSite=Lax Cookie)
// -----------------------------------------------------------------------------
if (session_status() === PHP_SESSION_NONE) {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    $sessionName = $config['auth']['session_name'] ?? 'ZIPPY_ADMIN_SESS';
    $sessionLifetime = $config['auth']['session_lifetime'] ?? (86400 * 7);

    session_name($sessionName);
    session_set_cookie_params([
        'lifetime' => $sessionLifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// -----------------------------------------------------------------------------
// Database Connection (PDO Singleton)
// -----------------------------------------------------------------------------
function get_db(): ?PDO {
    static $pdo = null;
    global $config;

    if ($pdo !== null) {
        return $pdo;
    }

    $dbConfig = $config['db'] ?? [];
    $host     = $dbConfig['host'] ?? 'localhost';
    $port     = $dbConfig['port'] ?? 3306;
    $dbname   = $dbConfig['dbname'] ?? '';
    $user     = $dbConfig['username'] ?? '';
    $pass     = $dbConfig['password'] ?? '';
    $charset  = $dbConfig['charset'] ?? 'utf8mb4';

    if (empty($dbname) || empty($user) || $pass === 'YOUR_STRONG_DATABASE_PASSWORD') {
        return null;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci",
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
function json_response($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function error_response(string $message, int $statusCode = 400, array $extra = []): void {
    json_response(array_merge(['error' => $message, 'success' => false], $extra), $statusCode);
}

function get_json_input(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    if (is_string($data)) {
        return trim($data);
    }
    return $data;
}

function is_authenticated(): bool {
    return !empty($_SESSION['admin_user_id']) && !empty($_SESSION['admin_user']);
}

function require_admin(): array {
    if (!is_authenticated()) {
        error_response('Unauthorized. Admin session required.', 401);
    }
    return $_SESSION['admin_user'];
}

function rate_limit_check(string $key, int $maxHits = 10, int $periodSeconds = 60): bool {
    $cacheDir = sys_get_temp_dir() . '/zippy_limits';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0777, true);
    }
    $hash = md5($key . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $file = "{$cacheDir}/limit_{$hash}.json";

    $now = time();
    $data = ['count' => 0, 'expires' => $now + $periodSeconds];

    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $parsed = @json_decode($content, true);
            if (is_array($parsed) && isset($parsed['expires']) && $parsed['expires'] > $now) {
                $data = $parsed;
            }
        }
    }

    $data['count']++;
    @file_put_contents($file, json_encode($data));

    return $data['count'] <= $maxHits;
}
