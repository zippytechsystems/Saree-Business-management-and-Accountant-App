<?php
/**
 * ZippyTechSystems Pvt. Ltd. — WhatsApp Outbound Message Sender
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed. Use POST.', 405);
}

// Admin only for manual sends
require_admin();

$input = get_json_input();
$toPhone = trim((string)($input['to'] ?? $input['phone'] ?? ''));
$message = trim((string)($input['message'] ?? ''));

if (empty($toPhone) || empty($message)) {
    error_response('Recipient phone number and message are required.', 400);
}

// Normalize phone to country code (e.g., 919876543210)
$cleanPhone = preg_replace('/\D/', '', $toPhone);
if (strlen($cleanPhone) === 10) {
    $cleanPhone = '91' . $cleanPhone;
}

$waConfig = $config['whatsapp'] ?? [];
$phoneId  = $waConfig['phone_number_id'] ?? '';
$token    = $waConfig['access_token'] ?? '';

if (empty($phoneId) || empty($token)) {
    // If WhatsApp Cloud API credentials are not set up yet, provide wa.me link fallback
    $waUrl = "https://wa.me/{$cleanPhone}?text=" . urlencode($message);
    json_response([
        'success'      => true,
        'simulated'    => true,
        'whatsapp_url' => $waUrl,
        'message'      => 'WhatsApp Cloud API token not set. Generated direct wa.me link.',
    ]);
}

$url = "https://graph.facebook.com/v19.0/{$phoneId}/messages";
$payload = [
    'messaging_product' => 'whatsapp',
    'recipient_type'    => 'individual',
    'to'                => $cleanPhone,
    'type'              => 'text',
    'text'              => ['preview_url' => true, 'body' => $message],
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$db = get_db();
if ($db !== null) {
    try {
        $st = $db->prepare('
            INSERT INTO `whatsapp_logs` (`phone`, `event_type`, `direction`, `payload`, `created_at`)
            VALUES (:phone, "manual_send", "outbound", :payload, NOW())
        ');
        $st->execute([
            ':phone'   => $cleanPhone,
            ':payload' => json_encode(['to' => $cleanPhone, 'text' => $message, 'response' => $res, 'status' => $httpCode]),
        ]);
    } catch (Exception $e) {}
}

if ($httpCode >= 200 && $httpCode < 300) {
    json_response(['success' => true, 'response' => json_decode((string)$res, true)]);
} else {
    error_response('Meta WhatsApp API error: ' . $res, $httpCode ?: 500);
}
