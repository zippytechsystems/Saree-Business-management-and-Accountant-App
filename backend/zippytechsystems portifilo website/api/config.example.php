<?php
/**
 * ZippyTechSystems Pvt. Ltd. — Backend Configuration Template
 * Domain: https://zippysoftwares.in
 *
 * Instructions:
 * Copy this file to `config.php` in the same directory (api/config.php).
 * Fill in your Hostinger MySQL database credentials and optional API keys.
 * Never commit `config.php` to Git.
 */

declare(strict_types=1);

return [
    // -------------------------------------------------------------------------
    // Database Configuration (Hostinger MySQL)
    // -------------------------------------------------------------------------
    'db' => [
        'host'     => getenv('DB_HOST')     ?: 'localhost',
        'port'     => (int)(getenv('DB_PORT') ?: 3306),
        'dbname'   => getenv('DB_NAME')     ?: 'u914601002_zippytech', // e.g. u914601002_zippytech
        'username' => getenv('DB_USER')     ?: 'u914601002_zippyuser', // e.g. u914601002_zippyuser
        'password' => getenv('DB_PASSWORD') ?: 'YOUR_STRONG_DATABASE_PASSWORD',
        'charset'  => 'utf8mb4',
    ],

    // -------------------------------------------------------------------------
    // Application & Security Settings
    // -------------------------------------------------------------------------
    'app' => [
        'name'            => 'ZippyTechSystems',
        'company_name'    => 'ZippyTechSystems Pvt. Ltd.',
        'base_url'        => 'https://zippysoftwares.in',
        'api_url'         => 'https://zippysoftwares.in/api',
        'allowed_origins' => [
            'https://zippysoftwares.in',
            'https://www.zippysoftwares.in',
            'http://localhost:5173',
            'http://localhost:3000',
        ],
        // Set to true in local development, false in production
        'debug'           => false,
        'timezone'        => 'Asia/Kolkata',
    ],

    // -------------------------------------------------------------------------
    // Session & Authentication Settings
    // -------------------------------------------------------------------------
    'auth' => [
        'session_name'     => 'ZIPPY_ADMIN_SESS',
        'session_lifetime' => 86400 * 7, // 7 days in seconds
        'session_secret'   => 'CHANGE_THIS_TO_A_64_CHARACTER_RANDOM_SECRET_STRING_NOW',
        'max_login_attempts' => 5,
        'lockout_duration'   => 900, // 15 minutes in seconds
    ],

    // -------------------------------------------------------------------------
    // File Uploads
    // -------------------------------------------------------------------------
    'upload' => [
        'directory'        => __DIR__ . '/../uploads',
        'public_path'      => '/uploads',
        'max_size_bytes'   => 10 * 1024 * 1024, // 10MB
        'allowed_types'    => [
            'image/jpeg'        => 'jpg',
            'image/png'         => 'png',
            'image/webp'        => 'webp',
            'image/svg+xml'     => 'svg',
            'application/pdf'   => 'pdf',
        ],
    ],

    // -------------------------------------------------------------------------
    // Notification & Email (SMTP for Inquiries)
    // -------------------------------------------------------------------------
    'mail' => [
        'enabled'      => false,
        'smtp_host'    => 'smtp.hostinger.com',
        'smtp_port'    => 465,
        'smtp_secure'  => 'ssl',
        'smtp_user'    => 'info@zippysoftwares.in',
        'smtp_pass'    => 'YOUR_EMAIL_PASSWORD',
        'from_email'   => 'info@zippysoftwares.in',
        'from_name'    => 'ZippyTechSystems Notifications',
        'notify_email' => 'lingaswamymaddeboina@gmail.com',
    ],

    // -------------------------------------------------------------------------
    // Chatbot AI Providers (Optional: Claude, OpenAI, or Gemini)
    // -------------------------------------------------------------------------
    'ai' => [
        // 'claude', 'openai', 'gemini', or 'local'
        'provider'         => 'claude',
        'anthropic_api_key'=> getenv('ANTHROPIC_API_KEY') ?: '',
        'claude_model'     => 'claude-3-5-sonnet-20241022',
        'openai_api_key'   => getenv('OPENAI_API_KEY')    ?: '',
        'gemini_api_key'   => getenv('GEMINI_API_KEY')    ?: '',
    ],

    // -------------------------------------------------------------------------
    // Voice / TTS Providers (Optional: Azure Neural TTS or ElevenLabs)
    // -------------------------------------------------------------------------
    'tts' => [
        'provider'         => 'azure', // 'azure' or 'browser'
        'azure_key'        => getenv('AZURE_SPEECH_KEY')    ?: '',
        'azure_region'     => getenv('AZURE_SPEECH_REGION') ?: 'centralindia',
        'default_voice'    => 'en-IN-NeerjaNeural',
    ],

    // -------------------------------------------------------------------------
    // WhatsApp Meta Cloud API (Optional)
    // -------------------------------------------------------------------------
    'whatsapp' => [
        'enabled'          => false,
        'phone_number_id'  => getenv('WHATSAPP_PHONE_ID')   ?: '',
        'access_token'     => getenv('WHATSAPP_TOKEN')      ?: '',
        'verify_token'     => getenv('WHATSAPP_VERIFY')     ?: 'zippy_webhook_verify_token_2026',
        'admin_phone'      => '916302690251',
    ],
];
