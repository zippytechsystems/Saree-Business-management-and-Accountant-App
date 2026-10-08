<?php
/**
 * ZippyTechSystems Pvt. Ltd. — Secure File Upload API
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed. Use POST.', 405);
}

// Admin only
require_admin();

// Check uploaded file
$file = $_FILES['file'] ?? $_FILES['image'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    $errCode = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    $msg = 'No valid file uploaded.';
    if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) {
        $msg = 'Uploaded file exceeds the maximum allowed file size.';
    }
    error_response($msg, 400);
}

$uploadConfig = $config['upload'] ?? [];
$maxSize = (int)($uploadConfig['max_size_bytes'] ?? (10 * 1024 * 1024)); // 10MB default
$allowedTypes = $uploadConfig['allowed_types'] ?? [
    'image/jpeg'        => 'jpg',
    'image/png'         => 'png',
    'image/webp'        => 'webp',
    'image/svg+xml'     => 'svg',
    'application/pdf'   => 'pdf',
];

// Check file size
if ($file['size'] > $maxSize) {
    error_response('File size exceeds the limit of ' . round($maxSize / (1024 * 1024)) . 'MB.', 400);
}

// Verify actual MIME type using finfo
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($allowedTypes[$mimeType])) {
    error_response("File type '{$mimeType}' is not permitted. Only images (JPG, PNG, WebP, SVG) and PDFs are allowed.", 400);
}

$extension = $allowedTypes[$mimeType];

// Resolve upload directory
$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

// Ensure .htaccess execution prevention in uploads directory
$htaccessFile = $uploadDir . '/.htaccess';
if (!file_exists($htaccessFile)) {
    $htaccessContent = <<<HTACCESS
# Block execution of any scripts in uploads directory
Options -ExecCGI -Indexes
RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps .cgi .pl .py .jsp .asp .sh
RemoveType .php .phtml .php3 .php4 .php5 .php7 .phps .cgi .pl .py .jsp .asp .sh
<IfModule mod_php.c>
    php_flag engine off
</IfModule>
<FilesMatch "\.(php|phtml|php3|php4|php5|php7|phps|cgi|pl|py|jsp|asp|sh|exe)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
HTACCESS;
    @file_put_contents($htaccessFile, $htaccessContent);
}

// Generate unique, collision-proof filename
try {
    $randomBytes = bin2hex(random_bytes(8));
} catch (Exception $e) {
    $randomBytes = uniqid();
}

$filename = 'zippy_' . date('Ymd_His') . '_' . $randomBytes . '.' . $extension;
$destination = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    error_response('Failed to save uploaded file.', 500);
}

@chmod($destination, 0644);

$publicUrl = '/uploads/' . $filename;

json_response([
    'success'   => true,
    'url'       => $publicUrl,
    'filename'  => $filename,
    'mime_type' => $mimeType,
    'size'      => $file['size'],
    'message'   => 'File uploaded successfully.',
]);
