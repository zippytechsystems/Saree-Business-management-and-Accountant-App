<?php
/**
 * ZippyTechSystems Pvt. Ltd. — AI Chatbot API Endpoint
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed. Use POST.', 405);
}

// Rate limiting: 40 messages per 10 minutes per IP
if (!rate_limit_check('chat_requests', 40, 600)) {
    error_response('Too many messages sent. Please slow down.', 429);
}

$input = get_json_input();
$sessionId = trim((string)($input['session_id'] ?? uniqid('sess_', true)));
$messages  = $input['messages'] ?? [];
$channel   = ($input['channel'] ?? 'text') === 'voice' ? 'voice' : 'text';
$pageUrl   = trim((string)($input['page_url'] ?? ''));

if (!is_array($messages) || empty($messages)) {
    error_response('Messages array is required.', 400);
}

$lastMsg = end($messages);
$userText = is_array($lastMsg) ? trim((string)($lastMsg['content'] ?? '')) : '';

if (empty($userText)) {
    error_response('User message text is required.', 400);
}

$db = get_db();

// -----------------------------------------------------------------------------
// Build Live Context from MySQL DB
// -----------------------------------------------------------------------------
$settings = [];
$domains = [];
$services = [];
$packages = [];
$projects = [];
$faqs = [];

if ($db !== null) {
    try {
        $st = $db->query("SELECT * FROM settings WHERE id = 1 LIMIT 1");
        $settings = $st->fetch() ?: [];

        $domains = $db->query("SELECT * FROM domains WHERE is_active = 1 ORDER BY sort_order ASC")->fetchAll() ?: [];
        $services = $db->query("SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC")->fetchAll() ?: [];
        $packages = $db->query("SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order ASC")->fetchAll() ?: [];
        $projects = $db->query("SELECT * FROM projects WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 10")->fetchAll() ?: [];
        $faqs = $db->query("SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 15")->fetchAll() ?: [];
    } catch (PDOException $e) {
        error_log("Chat context DB error: " . $e->getMessage());
    }
}

$founderName = $settings['founder_name'] ?? 'Lingaswamy Maddeboina';
$phone = $settings['phone'] ?? '6302690251';
$whatsapp = $settings['whatsapp_number'] ?? '6302690251';
$supportEmail = $settings['email'] ?? 'info@zippysoftwares.in';

// Format INR helper
function fmt_inr($val): string {
    if (!$val) return '₹0';
    $num = is_numeric($val) ? (float)$val : (float)preg_replace('/[^0-9.]/', '', (string)$val);
    return '₹' . number_format($num, 0, '.', ',');
}

// Build knowledge text
$knowledgeParts = [];
$knowledgeParts[] = "Company: ZippyTechSystems Pvt. Ltd. (Website: https://zippysoftwares.in)";
$knowledgeParts[] = "Founder: {$founderName} | Phone/WhatsApp: +91 {$whatsapp} | Email: {$supportEmail}";
$knowledgeParts[] = "Services & Starting Prices:";

foreach ($domains as $d) {
    $price = fmt_inr($d['starting_price'] ?? 0);
    $knowledgeParts[] = "- {$d['name']} ({$d['tagline']}): starting at {$price}. {$d['intro']}";
}

foreach ($packages as $pkg) {
    $price = fmt_inr($pkg['price'] ?? 0);
    $knowledgeParts[] = "- Package: {$pkg['name']} ({$pkg['category']}) at {$price}. {$pkg['description']}";
}

$systemPrompt = "You are the friendly, professional AI representative for ZippyTechSystems Pvt. Ltd. (https://zippysoftwares.in).\n"
    . "Founder: {$founderName} (Phone & WhatsApp: +91 {$whatsapp}).\n"
    . "Always provide accurate, enthusiastic, and concise answers about our software development, web design, mobile apps, and digital solutions.\n"
    . "If the user wants a quote or custom proposal, invite them to chat directly with Lingaswamy on WhatsApp (+91 {$whatsapp}) or fill our contact form.\n\n"
    . "LIVE COMPANY KNOWLEDGE:\n" . implode("\n", $knowledgeParts);

// -----------------------------------------------------------------------------
// Call AI Provider or Intelligent Local Fallback
// -----------------------------------------------------------------------------
$aiConfig = $config['ai'] ?? [];
$anthropicKey = $aiConfig['anthropic_api_key'] ?? '';
$openaiKey    = $aiConfig['openai_api_key'] ?? '';
$replyText    = '';

// 1. Anthropic Claude API
if (!empty($anthropicKey)) {
    $claudeModel = $aiConfig['claude_model'] ?? 'claude-3-5-sonnet-20241022';
    $payloadMessages = [];
    foreach ($messages as $m) {
        $role = ($m['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
        $payloadMessages[] = ['role' => $role, 'content' => (string)($m['content'] ?? '')];
    }

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $anthropicKey,
        'anthropic-version: 2023-06-01',
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model'       => $claudeModel,
        'max_tokens'  => 800,
        'system'      => $systemPrompt,
        'messages'    => $payloadMessages,
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $json = json_decode($res, true);
        if (!empty($json['content'][0]['text'])) {
            $replyText = trim($json['content'][0]['text']);
        }
    }
}

// 2. OpenAI API Fallback
if (empty($replyText) && !empty($openaiKey)) {
    $oaMessages = [['role' => 'system', 'content' => $systemPrompt]];
    foreach ($messages as $m) {
        $oaMessages[] = [
            'role'    => ($m['role'] ?? '') === 'assistant' ? 'assistant' : 'user',
            'content' => (string)($m['content'] ?? ''),
        ];
    }

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $openaiKey,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model'       => 'gpt-4o-mini',
        'messages'    => $oaMessages,
        'max_tokens'  => 600,
    ]));
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $json = json_decode($res, true);
        if (!empty($json['choices'][0]['message']['content'])) {
            $replyText = trim($json['choices'][0]['message']['content']);
        }
    }
}

// 3. Intelligent Local Fallback Response
if (empty($replyText)) {
    $lower = strtolower($userText);
    if (strpos($lower, 'price') !== false || strpos($lower, 'cost') !== false || strpos($lower, 'quote') !== false) {
        $replyText = "Hello! At ZippyTechSystems, our website development starts from ₹9,999, custom web applications from ₹24,999, and mobile apps from ₹49,999. Would you like a personalized quote? You can connect directly with our founder Lingaswamy on WhatsApp at +91 {$whatsapp}!";
    } elseif (strpos($lower, 'service') !== false || strpos($lower, 'offer') !== false || strpos($lower, 'work') !== false) {
        $replyText = "ZippyTechSystems specializes in full-stack web development, custom software, mobile apps (iOS & Android), UI/UX design, cloud solutions, and AI automation. What kind of project are you planning?";
    } elseif (strpos($lower, 'contact') !== false || strpos($lower, 'call') !== false || strpos($lower, 'phone') !== false || strpos($lower, 'whatsapp') !== false) {
        $replyText = "You can reach us directly anytime!\n📞 Call/WhatsApp: +91 {$whatsapp}\n📧 Email: {$supportEmail}\nOur founder Lingaswamy is available to discuss your requirements.";
    } elseif (strpos($lower, 'hello') !== false || strpos($lower, 'hi') !== false || strpos($lower, 'hey') !== false) {
        $replyText = "Hello! Welcome to ZippyTechSystems. I am your AI assistant. How can I help you elevate your business with modern web, mobile, or cloud solutions today?";
    } else {
        $replyText = "Thank you for reaching out! ZippyTechSystems delivers top-tier software solutions tailored to your business goals. For instant pricing and project consultations, feel free to chat with our founder Lingaswamy on WhatsApp (+91 {$whatsapp}) or drop your requirements here!";
    }
}

// -----------------------------------------------------------------------------
// Persist Message in MySQL (Chatbot Sessions & Messages)
// -----------------------------------------------------------------------------
if ($db !== null) {
    try {
        // Upsert session
        $sessStmt = $db->prepare('
            INSERT INTO `chatbot_sessions` (`id`, `channel`, `message_count`, `last_message_at`)
            VALUES (:id, :channel, 2, NOW())
            ON DUPLICATE KEY UPDATE `message_count` = `message_count` + 2, `last_message_at` = NOW()
        ');
        $sessStmt->execute([':id' => $sessionId, ':channel' => $channel]);

        // Insert user message
        $mStmt = $db->prepare('
            INSERT INTO `chatbot_messages` (`session_id`, `role`, `content`, `channel`, `page_url`, `created_at`)
            VALUES (:sid, "user", :content, :channel, :url, NOW())
        ');
        $mStmt->execute([
            ':sid'     => $sessionId,
            ':content' => $userText,
            ':channel' => $channel,
            ':url'     => $pageUrl,
        ]);

        // Insert assistant reply
        $mStmt->execute([
            ':sid'     => $sessionId,
            ':content' => $replyText,
            ':channel' => $channel,
            ':url'     => $pageUrl,
        ]);
    } catch (PDOException $e) {
        error_log("Chat persist error: " . $e->getMessage());
    }
}

$cleanWa = preg_replace('/\D/', '', $whatsapp);
if (strlen($cleanWa) === 10) $cleanWa = '91' . $cleanWa;
$waUrl = "https://wa.me/{$cleanWa}?text=" . urlencode("Hi Lingaswamy, I was chatting on zippysoftwares.in and would like to get a quote.");

json_response([
    'reply'        => $replyText,
    'session_id'   => $sessionId,
    'whatsapp_url' => $waUrl,
    'channel'      => $channel,
]);
