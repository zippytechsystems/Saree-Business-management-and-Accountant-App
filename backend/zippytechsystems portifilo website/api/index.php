<?php
/**
 * ZippyTechSystems Pvt. Ltd. — Unified REST API Router
 * Domain: https://zippysoftwares.in
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

// Parse endpoint & id from query or PATH_INFO
// Support:
// 1) /api/index.php?endpoint=services&id=1
// 2) /api/services or /api/services/1 (via .htaccess rewrite)
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$pathParts = explode('/', trim((string)$path, '/'));
// If requested like /api/services or /api/services/123
$endpoint = $_GET['endpoint'] ?? '';
$id = $_GET['id'] ?? null;

if (empty($endpoint)) {
    $apiIdx = array_search('api', $pathParts, true);
    if ($apiIdx !== false && isset($pathParts[$apiIdx + 1])) {
        $candidate = $pathParts[$apiIdx + 1];
        if ($candidate !== 'index.php') {
            $endpoint = $candidate;
            if (isset($pathParts[$apiIdx + 2])) {
                $id = $pathParts[$apiIdx + 2];
            }
        }
    }
}

$endpoint = preg_replace('/[^a-z0-9_]/', '', strtolower((string)$endpoint));
if (empty($endpoint)) {
    json_response([
        'status'  => 'online',
        'service' => 'ZippyTechSystems API',
        'domain'  => 'https://zippysoftwares.in',
        'version' => '2.0.0',
        'time'    => date('c'),
    ]);
}

$db = get_db();

// -----------------------------------------------------------------------------
// Model Routing Definitions
// -----------------------------------------------------------------------------
$tables = [
    'settings'          => ['table' => 'settings',         'pk' => 'id', 'single_row' => true],
    'domains'           => ['table' => 'domains',          'pk' => 'id', 'order' => 'sort_order ASC'],
    'services'          => ['table' => 'services',         'pk' => 'id', 'order' => 'sort_order ASC'],
    'packages'          => ['table' => 'packages',         'pk' => 'id', 'order' => 'sort_order ASC'],
    'projects'          => ['table' => 'projects',         'pk' => 'id', 'order' => 'sort_order ASC'],
    'testimonials'      => ['table' => 'testimonials',     'pk' => 'id', 'order' => 'sort_order ASC'],
    'faqs'              => ['table' => 'faqs',             'pk' => 'id', 'order' => 'sort_order ASC'],
    'enquiries'         => ['table' => 'enquiries',        'pk' => 'id', 'order' => 'created_at DESC'],
    'price_history'     => ['table' => 'price_history',    'pk' => 'id', 'order' => 'created_at DESC'],
    'service_areas'     => ['table' => 'service_areas',    'pk' => 'id', 'order' => 'sort_order ASC'],
    'clients'           => ['table' => 'clients',          'pk' => 'id', 'order' => 'sort_order ASC'],
    'process_steps'     => ['table' => 'process_steps',    'pk' => 'id', 'order' => 'sort_order ASC'],
    'technologies'      => ['table' => 'technologies',     'pk' => 'id', 'order' => 'sort_order ASC'],
    'site_stats'        => ['table' => 'site_stats',       'pk' => 'id', 'order' => 'sort_order ASC'],
    'before_after'      => ['table' => 'before_after',     'pk' => 'id', 'order' => 'sort_order ASC'],
    'design_settings'   => ['table' => 'design_settings',  'pk' => 'id', 'single_row' => true],
    'chatbot_settings'  => ['table' => 'chatbot_settings', 'pk' => 'id', 'single_row' => true],
    'chatbot_messages'  => ['table' => 'chatbot_messages', 'pk' => 'id', 'order' => 'created_at ASC'],
    'whatsapp_templates'=> ['table' => 'whatsapp_templates','pk' => 'id', 'order' => 'created_at DESC'],
    'whatsapp_logs'     => ['table' => 'whatsapp_logs',    'pk' => 'id', 'order' => 'created_at DESC'],
];

if (!isset($tables[$endpoint])) {
    error_response("Unknown API endpoint: {$endpoint}", 404);
}

$model = $tables[$endpoint];
$tableName = $model['table'];
$pk = $model['pk'];

// JSON columns helper to decode JSON fields in responses and encode on save
$jsonFields = [
    'settings'         => ['stats', 'business_hours', 'social_links', 'meta_tags'],
    'domains'          => ['features'],
    'services'         => ['features', 'deliverables', 'technologies', 'faqs'],
    'packages'         => ['features', 'addons'],
    'projects'         => ['tags', 'deliverables', 'gallery'],
    'clients'          => ['metadata'],
    'chatbot_settings' => ['suggested_questions', 'knowledge_base', 'business_hours'],
    'chatbot_messages' => ['metadata'],
    'enquiries'        => ['meta'],
    'whatsapp_logs'    => ['payload'],
];

function format_row_output(array $row, string $endpoint, array $jsonFields): array {
    $fields = $jsonFields[$endpoint] ?? [];
    foreach ($fields as $field) {
        if (isset($row[$field]) && is_string($row[$field])) {
            $decoded = json_decode($row[$field], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row[$field] = $decoded;
            }
        }
    }
    // Cast booleans
    foreach ($row as $k => $v) {
        if ($k === 'is_active' || $k === 'is_popular' || $k === 'is_featured' || $k === 'verified') {
            $row[$k] = (bool)$v;
        }
    }
    return $row;
}

// -----------------------------------------------------------------------------
// GET: Fetch records
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    // Check permission for private endpoints
    $adminOnlyGet = ['enquiries', 'chatbot_messages', 'whatsapp_logs', 'whatsapp_templates'];
    if (in_array($endpoint, $adminOnlyGet, true)) {
        require_admin();
    }

    if ($db === null) {
        // Return empty array or empty object if DB not configured yet
        json_response(!empty($model['single_row']) ? (object)[] : []);
    }

    try {
        if (!empty($model['single_row'])) {
            $stmt = $db->query("SELECT * FROM `{$tableName}` ORDER BY `{$pk}` ASC LIMIT 1");
            $row = $stmt->fetch();
            if ($row) {
                json_response(format_row_output($row, $endpoint, $jsonFields));
            }
            json_response((object)[]);
        }

        if ($id !== null && $id !== '') {
            $stmt = $db->prepare("SELECT * FROM `{$tableName}` WHERE `{$pk}` = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) {
                error_response('Record not found', 404);
            }
            json_response(format_row_output($row, $endpoint, $jsonFields));
        }

        // List records
        $sql = "SELECT * FROM `{$tableName}`";
        $params = [];
        $where = [];

        // Optional filtering by domain_id or service_id or status
        if (!empty($_GET['domain_id'])) {
            $where[] = "`domain_id` = :domain_id";
            $params[':domain_id'] = $_GET['domain_id'];
        }
        if (!empty($_GET['service_id'])) {
            $where[] = "`service_id` = :service_id";
            $params[':service_id'] = $_GET['service_id'];
        }
        if (!empty($_GET['status'])) {
            $where[] = "`status` = :status";
            $params[':status'] = $_GET['status'];
        }
        if (!empty($_GET['session_id']) && $endpoint === 'chatbot_messages') {
            $where[] = "`session_id` = :session_id";
            $params[':session_id'] = $_GET['session_id'];
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        if (!empty($model['order'])) {
            $sql .= " ORDER BY " . $model['order'];
        }

        if (!empty($_GET['limit'])) {
            $limit = max(1, min(500, (int)$_GET['limit']));
            $sql .= " LIMIT {$limit}";
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $output = array_map(function($r) use ($endpoint, $jsonFields) {
            return format_row_output($r, $endpoint, $jsonFields);
        }, $rows);

        json_response($output);
    } catch (PDOException $e) {
        error_log("API GET Error [{$endpoint}]: " . $e->getMessage());
        error_response('Database query error: ' . $e->getMessage(), 500);
    }
}

// -----------------------------------------------------------------------------
// POST: Create Record
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $input = get_json_input();

    // Special handling for public Enquiries submission
    if ($endpoint === 'enquiries') {
        if (!rate_limit_check('enquiry_submit', 10, 3600)) {
            error_response('Too many inquiry submissions. Please contact us via WhatsApp or phone.', 429);
        }

        $name    = trim((string)($input['name'] ?? ''));
        $email   = trim((string)($input['email'] ?? ''));
        $phone   = trim((string)($input['phone'] ?? ''));
        $message = trim((string)($input['message'] ?? ''));
        $service = trim((string)($input['service'] ?? $input['subject'] ?? ''));

        if (empty($name) || (empty($email) && empty($phone))) {
            error_response('Please provide your name and either phone or email.', 400);
        }

        if ($db === null) {
            // Still return success to prevent frontend crash
            json_response(['success' => true, 'id' => time(), 'message' => 'Enquiry received.']);
        }

        try {
            $stmt = $db->prepare('
                INSERT INTO `enquiries` (`name`, `email`, `phone`, `service`, `message`, `status`, `ip_address`, `created_at`)
                VALUES (:name, :email, :phone, :service, :message, "new", :ip, NOW())
            ');
            $stmt->execute([
                ':name'    => $name,
                ':email'   => $email,
                ':phone'   => $phone,
                ':service' => $service,
                ':message' => $message,
                ':ip'      => substr($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1', 0, 45),
            ]);
            $insertedId = (int)$db->lastInsertId();

            json_response([
                'success' => true,
                'id'      => $insertedId,
                'message' => 'Thank you! Your inquiry has been submitted. Our team will contact you shortly.',
            ]);
        } catch (PDOException $e) {
            error_log("Enquiry insert error: " . $e->getMessage());
            error_response('Failed to submit enquiry: ' . $e->getMessage(), 500);
        }
    }

    // All other POST endpoints require admin authentication
    require_admin();

    if ($db === null) {
        error_response('Database connection unavailable.', 500);
    }

    // Handle single-row update via POST (e.g., settings, design_settings)
    if (!empty($model['single_row'])) {
        $allowed = array_diff(array_keys($input), ['id', 'created_at', 'updated_at']);
        if (empty($allowed)) {
            error_response('No fields to update.', 400);
        }
        $sets = [];
        $params = [];
        foreach ($allowed as $col) {
            $val = $input[$col];
            if (is_array($val)) {
                $val = json_encode($val, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            }
            $sets[] = "`{$col}` = :{$col}";
            $params[":{$col}"] = $val;
        }
        $sql = "UPDATE `{$tableName}` SET " . implode(', ', $sets) . " WHERE `{$pk}` = 1";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        json_response(['success' => true, 'message' => 'Updated successfully.']);
    }

    // Multi-row INSERT
    $fields = array_diff(array_keys($input), ['created_at', 'updated_at']);
    if (empty($fields)) {
        error_response('No data provided.', 400);
    }

    $cols = [];
    $placeholders = [];
    $params = [];

    foreach ($fields as $col) {
        $val = $input[$col];
        if (is_array($val)) {
            $val = json_encode($val, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } elseif (is_bool($val)) {
            $val = $val ? 1 : 0;
        }
        $cols[] = "`{$col}`";
        $placeholders[] = ":{$col}";
        $params[":{$col}"] = $val;
    }

    try {
        $sql = "INSERT INTO `{$tableName}` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $newId = $db->lastInsertId();

        json_response([
            'success' => true,
            'id'      => is_numeric($newId) && $newId > 0 ? (int)$newId : ($input['id'] ?? null),
            'message' => 'Created successfully.',
        ], 201);
    } catch (PDOException $e) {
        error_log("Insert error [{$endpoint}]: " . $e->getMessage());
        error_response('Database insert error: ' . $e->getMessage(), 500);
    }
}

// -----------------------------------------------------------------------------
// PUT: Update Record
// -----------------------------------------------------------------------------
if ($method === 'PUT') {
    require_admin();

    if ($db === null) {
        error_response('Database connection unavailable.', 500);
    }

    $input = get_json_input();
    $targetId = $id ?? ($input['id'] ?? null);

    if (empty($model['single_row']) && ($targetId === null || $targetId === '')) {
        error_response('Missing ID for update.', 400);
    }

    $fields = array_diff(array_keys($input), ['id', 'created_at', 'updated_at']);
    if (empty($fields)) {
        error_response('No fields provided to update.', 400);
    }

    $sets = [];
    $params = [];

    foreach ($fields as $col) {
        $val = $input[$col];
        if (is_array($val)) {
            $val = json_encode($val, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } elseif (is_bool($val)) {
            $val = $val ? 1 : 0;
        }
        $sets[] = "`{$col}` = :col_{$col}";
        $params[":col_{$col}"] = $val;
    }

    try {
        if (!empty($model['single_row'])) {
            $sql = "UPDATE `{$tableName}` SET " . implode(', ', $sets) . " WHERE `{$pk}` = 1";
        } else {
            $sql = "UPDATE `{$tableName}` SET " . implode(', ', $sets) . " WHERE `{$pk}` = :target_id";
            $params[':target_id'] = $targetId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        json_response([
            'success' => true,
            'message' => 'Updated successfully.',
            'id'      => $targetId,
        ]);
    } catch (PDOException $e) {
        error_log("Update error [{$endpoint}]: " . $e->getMessage());
        error_response('Database update error: ' . $e->getMessage(), 500);
    }
}

// -----------------------------------------------------------------------------
// DELETE: Remove Record
// -----------------------------------------------------------------------------
if ($method === 'DELETE') {
    require_admin();

    if ($db === null) {
        error_response('Database connection unavailable.', 500);
    }

    $targetId = $id ?? ($_GET['id'] ?? null);
    if ($targetId === null || $targetId === '') {
        $input = get_json_input();
        $targetId = $input['id'] ?? null;
    }

    if ($targetId === null || $targetId === '') {
        error_response('Missing ID for deletion.', 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM `{$tableName}` WHERE `{$pk}` = :id");
        $stmt->execute([':id' => $targetId]);

        json_response([
            'success' => true,
            'message' => 'Deleted successfully.',
            'id'      => $targetId,
        ]);
    } catch (PDOException $e) {
        error_log("Delete error [{$endpoint}]: " . $e->getMessage());
        error_response('Database delete error: ' . $e->getMessage(), 500);
    }
}

error_response('Method not allowed.', 405);
