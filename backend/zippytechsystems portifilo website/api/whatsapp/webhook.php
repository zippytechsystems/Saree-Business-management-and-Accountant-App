<?php
/**
 * ZippyTechSystems Pvt. Ltd. — WhatsApp Cloud API Webhook Handler
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$waConfig = $config['whatsapp'] ?? [];
$verifyToken = $waConfig['verify_token'] ?? 'zippy_webhook_verify_token_2026';

// -----------------------------------------------------------------------------
// Meta Webhook Verification (GET hub.challenge)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode      = $_GET['hub_mode'] ?? '';
    $token     = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';

    if ($mode === 'subscribe' && $token === $verifyToken) {
        http_response_code(200);
        header('Content-Type: text/plain');
        echo $challenge;
        exit;
    }

    http_response_code(403);
    echo 'Forbidden';
    exit;
}

// -----------------------------------------------------------------------------
// Inbound WhatsApp Event (POST)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = get_json_input();
    $db = get_db();

    // Log payload
    if ($db !== null && !empty($payload)) {
        try {
            $stmt = $db->prepare('
                INSERT INTO `whatsapp_logs` (`event_type`, `direction`, `payload`, `created_at`)
                VALUES ("webhook_event", "inbound", :payload, NOW())
            ');
            $stmt->execute([':payload' => json_encode($payload)]);
        } catch (Exception $e) {
            error_log("WhatsApp log error: " . $e->getMessage());
        }
    }

    // Always respond 200 OK to Meta
    json_response(['status' => 'received']);
}

error_response('Method not allowed.', 405);
