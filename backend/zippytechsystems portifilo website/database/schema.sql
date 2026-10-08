-- =========================================================================
-- ZippyTechSystems Pvt. Ltd. — Complete Hostinger MySQL Production Schema
-- Database: MySQL 8.0+ (InnoDB, utf8mb4)
-- Domain: https://zippysoftwares.in
-- =========================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET foreign_key_checks = 0;

-- -------------------------------------------------------------------------
-- 1. ADMIN USERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Administrator',
  `failed_login_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial admin user: lingaswamymaddeboina
-- password_hash for 'linga@123' generated with password_hash('linga@123', PASSWORD_BCRYPT)
INSERT INTO `admin_users` (`id`, `username`, `email`, `password_hash`, `role`)
VALUES (
  1,
  'lingaswamymaddeboina',
  'lingaswamymaddeboina@gmail.com',
  '$2y$10$w8W7dM9fWdE/e0g71M.7te11yZ1Y9G3gQeM/a3e5.yF5qN9uB8g3W',
  'Administrator'
) ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- -------------------------------------------------------------------------
-- 2. SESSIONS TABLE (Persistent Server-Side Session Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(128) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NULL,
  `payload` MEDIUMTEXT NULL,
  `last_activity` INT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. SETTINGS TABLE (Single-Row Configuration)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `phone` VARCHAR(20) NOT NULL DEFAULT '6302690251',
  `whatsapp_number` VARCHAR(20) NOT NULL DEFAULT '916302690251',
  `default_whatsapp_message` TEXT NOT NULL,
  `tagline` VARCHAR(255) NOT NULL DEFAULT 'Build • Automate • Grow',
  `secondary_tagline` VARCHAR(255) NOT NULL DEFAULT 'Smart Technology for a Stronger Tomorrow',
  `location` VARCHAR(255) NOT NULL DEFAULT 'Hyderabad, Telangana, India',
  `instagram_url` VARCHAR(255) DEFAULT 'https://www.instagram.com/zippytechsystems',
  `youtube_url` VARCHAR(255) DEFAULT 'https://www.youtube.com/@zippytechsystems',
  `founder_name` VARCHAR(150) NOT NULL DEFAULT 'Lingaswamy Maddeboina',
  `working_hours` VARCHAR(150) DEFAULT 'Mon - Sat: 9:00 AM - 8:00 PM',
  `office_address` TEXT NULL,
  `email` VARCHAR(191) DEFAULT 'contact@zippysoftwares.in',
  `about_text` TEXT NULL,
  `delivery_note` VARCHAR(255) DEFAULT '48h to 7 days delivery guarantee',
  `languages_supported` VARCHAR(255) DEFAULT 'English, Telugu, Hindi',
  `response_time_text` VARCHAR(100) DEFAULT '24 hours',
  `facebook_url` VARCHAR(255) DEFAULT '',
  `linkedin_url` VARCHAR(255) DEFAULT '',
  `notify_email_enabled` TINYINT(1) DEFAULT 1,
  `wa_auto_reply_enabled` TINYINT(1) DEFAULT 0,
  `wa_admin_alert_enabled` TINYINT(1) DEFAULT 0,
  `wa_template_en` TEXT NULL,
  `wa_template_te` TEXT NULL,
  `wa_template_hi` TEXT NULL,
  `whatsapp_bot_enabled` TINYINT(1) DEFAULT 1,
  `whatsapp_auto_confirm` TINYINT(1) DEFAULT 0,
  `whatsapp_followups` TINYINT(1) DEFAULT 0,
  `whatsapp_status_updates` TINYINT(1) DEFAULT 0,
  `quiet_hours_start` VARCHAR(10) DEFAULT '22:00',
  `quiet_hours_end` VARCHAR(10) DEFAULT '08:00',
  `daily_summary_enabled` TINYINT(1) DEFAULT 0,
  `google_sheet_export_enabled` TINYINT(1) DEFAULT 0,
  `human_pause_hours` INT DEFAULT 2,
  `wa_admin_to` VARCHAR(50) DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `phone`, `whatsapp_number`, `default_whatsapp_message`, `tagline`, `secondary_tagline`, `location`, `instagram_url`, `youtube_url`, `founder_name`, `email`, `wa_template_en`, `wa_template_te`, `wa_template_hi`)
VALUES (
  1,
  '6302690251',
  '916302690251',
  'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
  'Build • Automate • Grow',
  'Smart Technology for a Stronger Tomorrow',
  'Hyderabad, Telangana, India',
  'https://www.instagram.com/zippytechsystems',
  'https://www.youtube.com/@zippytechsystems',
  'Lingaswamy Maddeboina',
  'contact@zippysoftwares.in',
  'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.',
  'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.',
  'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।'
) ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- -------------------------------------------------------------------------
-- 4. DOMAINS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `domains` (
  `id` VARCHAR(20) PRIMARY KEY,
  `key` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `intro` TEXT NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `starting_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_label` VARCHAR(50) NOT NULL DEFAULT 'Starting from',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `domains` (`id`, `key`, `name`, `intro`, `color`, `starting_price`, `price_label`, `sort_order`, `is_active`)
VALUES
('web', 'web', 'Web Development', 'A modern, high-speed website that brings local customers to your door 24/7.', '#1d5cf0', 6500.00, 'Starting from', 1, 1),
('app', 'app', 'App Development', 'Custom billing, accounts, and inventory apps for retail and wholesale shops.', '#12a150', 20000.00, 'Starting from', 2, 1),
('ai', 'ai', 'AI Automation', 'Never lose another customer enquiry with 24/7 WhatsApp and voice agents.', '#7a2fd0', 7500.00, 'Starting from', 3, 1)
ON DUPLICATE KEY UPDATE `starting_price` = VALUES(`starting_price`);

-- -------------------------------------------------------------------------
-- 5. SERVICES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(36) PRIMARY KEY,
  `domain_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('main', 'more') NOT NULL DEFAULT 'main',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_services_domain` (`domain_id`, `sort_order`),
  CONSTRAINT `fk_services_domain` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services` (`id`, `domain_id`, `name`, `description`, `type`, `sort_order`, `is_active`) VALUES
('srv_w1', 'web', 'Business Websites & Landing Pages', 'High-converting, professional web pages that establish immediate credibility and capture customer enquiries.', 'main', 1, 1),
('srv_w2', 'web', 'Services / Products Showcase Websites', 'Visual catalog websites displaying your complete offerings, pricing, and client testimonials.', 'main', 2, 1),
('srv_w3', 'web', 'E-Commerce Business Websites', 'Online shopping stores with fast mobile checkout, UPI / Razorpay payment gateways, and order tracking.', 'main', 3, 1),
('srv_w4', 'web', 'Custom Domain & Hosting Setup', 'End-to-end setup of your custom .com / .in domain, high-speed cloud hosting, and free SSL certificate.', 'main', 4, 1),
('srv_w5', 'web', 'Portfolio, restaurant, clinic, school and real estate websites', '', 'more', 5, 1),
('srv_w6', 'web', 'Booking and appointment scheduling websites', '', 'more', 6, 1),
('srv_w7', 'web', 'Website redesign and modernization', '', 'more', 7, 1),
('srv_w8', 'web', 'Search Engine Optimization (SEO) & Google Business Profile setup', '', 'more', 8, 1),
('srv_w9', 'web', 'Payment gateway integration (Razorpay, PhonePe, UPI)', '', 'more', 9, 1),
('srv_w10', 'web', 'Ongoing website maintenance, security updates and yearly support', '', 'more', 10, 1),

('srv_a1', 'app', 'Accountant App', 'Automates daily khata, ledger entries, customer credit balance, GST invoicing, and financial reports.', 'main', 1, 1),
('srv_a2', 'app', 'Business Management App', 'Centralized mobile management app tracking inventory, purchases, supplier payments, and shop operations.', 'main', 2, 1),
('srv_a3', 'app', 'E-Commerce Business App', 'Dedicated Android & iOS shopping app for your shop with instant push notifications and fast checkout.', 'main', 3, 1),
('srv_a4', 'app', 'Staff Management App', 'Digital staff attendance, overtime tracker, salary slip calculator, and daily staff shift roster.', 'main', 4, 1),
('srv_a5', 'app', 'Billing / POS and barcode inventory apps', '', 'more', 5, 1),
('srv_a6', 'app', 'GST invoice & thermal receipt printing app', '', 'more', 6, 1),
('srv_a7', 'app', 'CRM and customer loyalty management app', '', 'more', 7, 1),
('srv_a8', 'app', 'Delivery partner and appointment booking apps', '', 'more', 8, 1),
('srv_a9', 'app', 'School / college administration apps', '', 'more', 9, 1),
('srv_a10', 'app', 'Google Play Store and Apple App Store publishing', '', 'more', 10, 1),
('srv_a11', 'app', 'Continuous app maintenance, feature upgrades and bug fixes', '', 'more', 11, 1),

('srv_i1', 'ai', 'WhatsApp Automation', 'Automatic replies to customers on WhatsApp, greeting new visitors, sharing catalogs, and qualifying leads.', 'main', 1, 1),
('srv_i2', 'ai', 'AI Voice Agent', 'Answers business enquiry calls intelligently, provides details, and schedules callbacks.', 'main', 2, 1),
('srv_i3', 'ai', 'AI Chatbot for Your Website', 'Handles customer enquiries 24x7 directly on your website and captures contact numbers.', 'main', 3, 1),
('srv_i4', 'ai', 'Lead Management Automation', 'Syncs incoming customer enquiries instantly to Google Sheets, CRM, and sales team phones.', 'main', 4, 1),
('srv_i5', 'ai', 'Follow-Up Reminders', 'Automated follow-up messages on WhatsApp for pending quotations and customer decisions.', 'main', 5, 1),
('srv_i6', 'ai', 'Customer Support Automation', 'Resolves frequent customer queries (timings, pricing, location, order status) without manual effort.', 'main', 6, 1),
('srv_i7', 'ai', 'Auto invoices and payment reminder workflows', '', 'more', 7, 1),
('srv_i8', 'ai', 'Email and social media inquiry automation', '', 'more', 8, 1),
('srv_i9', 'ai', 'Data entry and document processing automation', '', 'more', 9, 1),
('srv_i10', 'ai', 'AI content and marketing copy tools', '', 'more', 10, 1),
('srv_i11', 'ai', 'Google Sheets, Zoho, Excel and CRM integrations', '', 'more', 11, 1),
('srv_i12', 'ai', 'Custom AI agents tailored for your unique business operations', '', 'more', 12, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- -------------------------------------------------------------------------
-- 6. PACKAGES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `domain_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `features` JSON NOT NULL,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_packages_domain` (`domain_id`, `sort_order`),
  CONSTRAINT `fk_packages_domain` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `packages` (`id`, `domain_id`, `name`, `price`, `features`, `is_popular`, `sort_order`, `is_active`) VALUES
('pkg_1', 'web', 'Starter Web Presence', 6500.00, '["Single-page fast responsive landing site", "Direct WhatsApp chat button & Call CTA", "Mobile, tablet & desktop optimized", "Google Maps & Google Business profile link", "Free SSL certificate & fast cloud hosting setup", "7 days turnaround time"]', 0, 1, 1),
('pkg_2', 'web', 'Business Growth Showcase', 14500.00, '["Up to 5 custom pages (Home, About, Services, Gallery, Contact)", "Full service/product visual showcase catalog", "Customer enquiry form with database & WhatsApp sync", "On-page SEO optimization & metadata", "Google Search Console indexing", "30 days free support & maintenance"]', 1, 2, 1),
('pkg_3', 'app', 'Shop Billing & Udhar App', 20000.00, '["Fast barcode scanning & POS billing", "GST & non-GST thermal receipt printing", "Customer credit ledger (Udhar tracking & WhatsApp reminders)", "Daily cash in hand & profit report on mobile", "Tamper-proof calculations & offline support", "Free staff training session"]', 1, 3, 1),
('pkg_4', 'app', 'Complete Business Management App', 22000.00, '["Multi-user roles (Owner, Manager, Cashier)", "Live warehouse stock alerts & supplier order records", "Staff attendance & payroll calculation", "Cloud backup & multi-device sync", "Android APK + Web dashboard included", "3 months priority bugfix guarantee"]', 0, 4, 1),
('pkg_5', 'ai', 'WhatsApp 24/7 Auto-Responder', 7500.00, '["Official or QR WhatsApp automation setup", "Instant replies with price cards & catalog PDF", "Lead qualification & phone number capture", "Instant alert on owner mobile for hot leads", "Custom business greeting & FAQ answering", "Quick 48-hour deployment"]', 1, 5, 1),
('pkg_6', 'ai', 'AI Voice & Lead Pipeline Suite', 16000.00, '["AI Voice Agent for telephone enquiry triage", "Website AI chatbot widget trained on your business", "Sync leads automatically to Google Sheets & CRM", "Automated follow-up WhatsApp reminders for pending quotes", "Weekly analytics of customer questions and conversions", "Dedicated onboarding & testing"]', 0, 6, 1)
ON DUPLICATE KEY UPDATE `price` = VALUES(`price`);

-- -------------------------------------------------------------------------
-- 7. PROJECTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `domain_id` VARCHAR(20) NOT NULL,
  `client_category` VARCHAR(150) DEFAULT 'Business Solutions',
  `description` TEXT NOT NULL,
  `technologies` JSON NULL,
  `metrics` VARCHAR(255) DEFAULT '',
  `link` VARCHAR(255) DEFAULT '',
  `image_url` VARCHAR(255) NOT NULL,
  `video_url` VARCHAR(255) NULL,
  `poster_url` VARCHAR(255) NULL,
  `gallery` JSON NULL,
  `tech_stack` JSON NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `alt_text` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_projects_domain` (`domain_id`, `sort_order`),
  CONSTRAINT `fk_projects_domain` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` (`id`, `title`, `domain_id`, `client_category`, `description`, `technologies`, `metrics`, `link`, `image_url`, `sort_order`, `is_active`) VALUES
('prj_1', 'Reddy Multi-Specialty Dental Clinic', 'web', 'Healthcare & Clinics', 'Modern showcase website with online WhatsApp appointment booking and treatment price charts.', '["React", "Vite", "Cloud Hosting", "SEO"]', '3x WhatsApp appointments in 30 days', 'https://wa.me/916302690251', '/projects/clinic-web.svg', 1, 1),
('prj_2', 'Sri Lakshmi Silks & Sarees POS Billing App', 'app', 'Retail Clothing & Textiles', 'Fast barcode billing and customer credit (udhar) tracker with thermal printing and SMS alerts.', '["Flutter", "MySQL", "Thermal Bluetooth API"]', 'Saved ₹18,000/mo in bookkeeping fees', 'https://wa.me/916302690251', '/projects/saree-app.svg', 2, 1),
('prj_3', 'Varma Logistics 24/7 AI WhatsApp Dispatcher', 'ai', 'Logistics & Cargo', 'Intelligent WhatsApp auto-responder providing instant freight quotes and driver status.', '["Python", "FastAPI", "WhatsApp Cloud API", "GPT-4o"]', '35% higher booking rate after hours', 'https://wa.me/916302690251', '/projects/dispatch-ai.svg', 3, 1),
('prj_4', 'Modern Home Interiors Showcase Portal', 'web', 'Interior Design & Architecture', 'High-resolution project gallery with cost calculator and customer lead capture.', '["React", "CSS Modules", "MySQL"]', 'Over 80 qualified local leads generated', 'https://wa.me/916302690251', '/projects/interior-web.svg', 4, 1),
('prj_5', 'SuperFresh Mart Grocery Delivery & Billing App', 'app', 'Supermarkets & Groceries', 'Android app with barcode scanner, inventory re-ordering, and delivery boy dispatch tracking.', '["React Native", "Node.js", "MySQL"]', '50% faster checkout during peak hours', 'https://wa.me/916302690251', '/projects/mart-app.svg', 5, 1),
('prj_6', 'Apex Solar Solutions Lead Automation', 'ai', 'Renewable Energy', 'Automated solar quote generator syncing directly to Google Sheets and sending instant PDF proposals.', '["PHP API", "Google Sheets API", "WhatsApp Bot"]', 'Response time reduced from 4 hours to 30 seconds', 'https://wa.me/916302690251', '/projects/solar-ai.svg', 6, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- -------------------------------------------------------------------------
-- 8. TESTIMONIALS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` VARCHAR(36) PRIMARY KEY,
  `client_name` VARCHAR(150) NOT NULL,
  `business` VARCHAR(255) NOT NULL,
  `domain_id` VARCHAR(20) NULL,
  `rating` TINYINT NOT NULL DEFAULT 5,
  `message` TEXT NOT NULL,
  `photo_url` VARCHAR(255) NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_testimonials_sort` (`sort_order`, `is_active`),
  CONSTRAINT `fk_testimonials_domain` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `testimonials` (`id`, `client_name`, `business`, `domain_id`, `rating`, `message`, `sort_order`, `is_active`) VALUES
('tst_1', 'Dr. Ramesh Reddy', 'Reddy Multi-Specialty Dental Clinic, Hyderabad', 'web', 5, 'Lingaswamy built our clinic showcase website in just 4 days. Patients can now easily view treatments, doctors, and book appointments directly on WhatsApp. Super fast delivery and extremely affordable!', 1, 1),
('tst_2', 'Suresh Patel', 'Patel Wholesale Electricals, Secunderabad', 'app', 5, 'The custom billing and stock app replaced our expensive accounting software. We save at least ₹18,000 every month on accountant salaries, and I can check my shop daily sales on my phone from anywhere.', 2, 1),
('tst_3', 'Vikram Varma', 'Varma Logistics & Transport, Vijayawada', 'ai', 5, 'The 24/7 WhatsApp AI automation handles late-night freight rate queries instantly. We turned 35% more leads into booked orders within the first month itself.', 3, 1),
('tst_4', 'Ananya Sharma', 'TrendBoutique Ethnic Studio, Bangalore', 'web', 5, 'Great design aesthetic, mobile responsive, and honest pricing. Lingaswamy is always available on phone and WhatsApp without any corporate bureaucracy.', 4, 1)
ON DUPLICATE KEY UPDATE `client_name` = VALUES(`client_name`);

-- -------------------------------------------------------------------------
-- 9. FAQS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL DEFAULT 'General',
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_faqs_cat` (`category`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `faqs` (`id`, `category`, `question`, `answer`, `sort_order`, `is_active`) VALUES
('faq_1', 'General', 'What makes ZippyTechSystems different from other agencies in India?', 'We eliminate bloated agency overhead and middleman layers. You communicate directly with founder Lingaswamy on WhatsApp or call. We provide transparent starting prices (Web from ₹6.5k, App from ₹20k, AI from ₹7.5k) and deliver production-ready software in 48 hours to 7 days.', 1, 1),
('faq_2', 'Web', 'What is included in the ₹6,500 Web Development starting package?', 'It includes a modern responsive business website, custom domain connection, lightning-fast cloud hosting setup, mobile optimization, WhatsApp direct integration, contact form, and Google Search Console/SEO basics.', 2, 1),
('faq_3', 'App', 'How does your business app help save on accountant salaries?', 'Our custom mobile & web applications automate day-to-day billing, GST invoice generation, thermal print receipts, customer udhar (credit ledger), and stock levels. Because calculations and reports are automated and tamper-proof, shop owners do not need to hire a full-time accountant for daily entries.', 3, 1),
('faq_4', 'AI', 'How does WhatsApp AI Automation work when our shop is closed?', 'Our AI agent connects to your WhatsApp business number. When a customer messages at night or during peak rush hours, the AI answers product questions, shares price lists or catalogs, collects their requirements, and syncs their phone number to your dashboard or Google Sheet.', 4, 1),
('faq_5', 'General', 'What are your payment terms and milestones?', 'We work with clear, risk-free milestones: a small advance to initiate the architecture and wireframing, milestone reviews where you inspect the live demo, and final payment upon your 100% satisfaction and handover.', 5, 1),
('faq_6', 'General', 'Do you offer ongoing support and maintenance?', 'Yes! All projects come with 30 days of complimentary post-launch support. Afterward, we provide affordable yearly maintenance packages covering security updates, server monitoring, backups, and feature tweaks.', 6, 1)
ON DUPLICATE KEY UPDATE `question` = VALUES(`question`);

-- -------------------------------------------------------------------------
-- 10. ENQUIRIES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(191) NULL,
  `service` VARCHAR(150) NOT NULL,
  `message` TEXT NULL,
  `status` ENUM('New', 'Contacted', 'Closed') NOT NULL DEFAULT 'New',
  `source` ENUM('contact', 'quote', 'project', 'callback', 'chatbot', 'whatsapp', 'whatsapp-callback') NOT NULL DEFAULT 'contact',
  `selected_services` JSON NULL,
  `budget_range` VARCHAR(100) NULL,
  `timeline` VARCHAR(100) NULL,
  `business_type` VARCHAR(150) NULL,
  `notes` TEXT NULL,
  `whatsapp_opt_in` TINYINT(1) DEFAULT 0,
  `follow_up_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_enquiries_status` (`status`, `created_at`),
  INDEX `idx_enquiries_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 11. PRICE HISTORY TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `price_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `item_type` ENUM('domain', 'package') NOT NULL,
  `item_id` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `old_price` DECIMAL(10,2) NOT NULL,
  `new_price` DECIMAL(10,2) NOT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_price_history_time` (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 12. SERVICE AREAS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_areas` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('office', 'service_area', 'online') NOT NULL DEFAULT 'online',
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) DEFAULT 'Telangana',
  `map_link` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_service_areas_sort` (`sort_order`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `service_areas` (`id`, `name`, `type`, `notes`, `sort_order`, `is_active`) VALUES
('sa_1', 'Online (all India)', 'online', 'Remote delivery and digital support across all states in India', 0, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- -------------------------------------------------------------------------
-- 13. CHAT SESSIONS & CHAT MESSAGES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `session_id` VARCHAR(100) NOT NULL UNIQUE,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_message_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `page_url` VARCHAR(255) DEFAULT '',
  `lead_id` VARCHAR(36) NULL,
  `ip_hash` VARCHAR(64) DEFAULT '',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_chat_sessions_last` (`last_message_at`),
  CONSTRAINT `fk_chat_sessions_lead` FOREIGN KEY (`lead_id`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `session_id` VARCHAR(100) NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_chat_msg_session` (`session_id`, `created_at`),
  CONSTRAINT `fk_chat_msg_session` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 14. CHATBOT SETTINGS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chatbot_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `welcome_message` TEXT NOT NULL,
  `fallback_message` TEXT NOT NULL,
  `quick_replies` JSON NOT NULL,
  `extra_instructions` TEXT NULL,
  `model` VARCHAR(100) NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  `daily_limit` INT NOT NULL DEFAULT 500,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatbot_settings` (`id`, `enabled`, `welcome_message`, `fallback_message`, `quick_replies`, `extra_instructions`, `model`, `daily_limit`)
VALUES (
  1,
  1,
  'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
  'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized pricing and consultation!',
  '["Website services", "App for my shop", "AI chatbot / WhatsApp automation", "Prices", "Talk to Lingaswamy"]',
  '',
  'claude-haiku-4-5-20251001',
  500
) ON DUPLICATE KEY UPDATE `enabled` = VALUES(`enabled`);

-- -------------------------------------------------------------------------
-- 15. NOTIFICATION LOG
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `enquiry_id` VARCHAR(36) NULL,
  `channel` VARCHAR(50) NOT NULL,
  `recipient` VARCHAR(191) NOT NULL,
  `status` ENUM('sent', 'failed', 'skipped') NOT NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_enquiry` (`enquiry_id`),
  INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 16. DESIGN SETTINGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `design_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `hero_style` VARCHAR(50) DEFAULT 'mesh',
  `video_background_url` VARCHAR(255) NULL,
  `video_poster_url` VARCHAR(255) NULL,
  `particles_enabled` TINYINT(1) DEFAULT 1,
  `cursor_effect_enabled` TINYINT(1) DEFAULT 1,
  `magnetic_buttons_enabled` TINYINT(1) DEFAULT 1,
  `parallax_enabled` TINYINT(1) DEFAULT 1,
  `horizontal_portfolio_enabled` TINYINT(1) DEFAULT 1,
  `lottie_enabled` TINYINT(1) DEFAULT 1,
  `tooltip_enabled` TINYINT(1) DEFAULT 1,
  `quality_override` VARCHAR(50) DEFAULT 'auto',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `design_settings` (`id`, `hero_style`, `particles_enabled`, `cursor_effect_enabled`, `magnetic_buttons_enabled`, `parallax_enabled`, `horizontal_portfolio_enabled`, `lottie_enabled`, `tooltip_enabled`, `quality_override`)
VALUES (1, 'mesh', 1, 1, 1, 1, 1, 1, 1, 'auto')
ON DUPLICATE KEY UPDATE `hero_style` = VALUES(`hero_style`);

-- -------------------------------------------------------------------------
-- 17. CLIENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `logo_url` TEXT NOT NULL,
  `website` VARCHAR(255) NULL,
  `alt_text` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_clients_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 18. PROCESS STEPS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `process_steps` (
  `id` VARCHAR(36) PRIMARY KEY,
  `step_number` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `icon_key` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_steps_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `process_steps` (`id`, `step_number`, `title`, `description`, `icon_key`, `is_active`, `sort_order`) VALUES
('step_1', 1, 'Requirement Gathering', 'We discuss your exact business workflow and pricing targets directly on WhatsApp or phone.', 'MessageCircle', 1, 1),
('step_2', 2, 'Architecture & Rapid Prototype', 'We design a clean, responsive prototype tailored to your brand colors and Indian customers.', 'Layers', 1, 2),
('step_3', 3, 'Full-Stack Development', 'Production code built with modern frameworks, Razorpay/UPI payments, and sub-second load times.', 'Cpu', 1, 3),
('step_4', 4, 'Launch & Ongoing Support', 'We deploy on cloud hosting with free SSL, setup your domain, and provide continuous warranty.', 'ShieldCheck', 1, 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- -------------------------------------------------------------------------
-- 19. TECHNOLOGIES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `technologies` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `icon_key` VARCHAR(50) NULL,
  `category` VARCHAR(50) DEFAULT 'Frontend',
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 20. SITE STATS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_stats` (
  `id` VARCHAR(36) PRIMARY KEY,
  `stat_key` VARCHAR(50) NOT NULL UNIQUE,
  `label` VARCHAR(150) NOT NULL,
  `value_number` INT NOT NULL,
  `prefix` VARCHAR(20) DEFAULT '',
  `suffix` VARCHAR(20) DEFAULT '',
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_stats` (`id`, `stat_key`, `label`, `value_number`, `prefix`, `suffix`, `sort_order`, `is_active`) VALUES
('stat_1', 'projects_delivered', 'Projects Delivered', 24, '', '+', 1, 1),
('stat_2', 'avg_delivery_days', 'Fast Delivery Rate', 7, '<', ' Days', 2, 1),
('stat_3', 'client_satisfaction', 'Client Retention & Satisfaction', 99, '', '%', 3, 1),
('stat_4', 'direct_support', 'Founder Direct Response', 24, '<', 'h', 4, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`);

-- -------------------------------------------------------------------------
-- 21. BEFORE & AFTER CASE STUDIES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `before_after` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `domain` VARCHAR(50) NOT NULL,
  `before_metric` VARCHAR(100) NULL,
  `after_metric` VARCHAR(100) NULL,
  `before_description` TEXT NULL,
  `after_description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 22. WHATSAPP CONTACTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_contacts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(150) DEFAULT '',
  `language` ENUM('en', 'te', 'hi') DEFAULT 'en',
  `opted_out` TINYINT(1) DEFAULT 0,
  `opt_in_source` VARCHAR(50) DEFAULT 'whatsapp',
  `last_customer_message_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ai_paused_until` DATETIME NULL,
  `status` ENUM('active', 'needs_human', 'opted_out') DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_wa_phone` (`phone`),
  INDEX `idx_wa_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 23. WHATSAPP MESSAGES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` BIGINT NOT NULL,
  `wa_message_id` VARCHAR(150) NULL UNIQUE,
  `direction` ENUM('inbound', 'outbound') NOT NULL,
  `source` ENUM('bot', 'app', 'admin', 'customer', 'automation') DEFAULT 'bot',
  `type` ENUM('text', 'interactive', 'template', 'media', 'unsupported') DEFAULT 'text',
  `content` TEXT NOT NULL,
  `raw_payload` JSON NULL,
  `status` ENUM('received', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  `error` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wa_msg_contact` (`contact_id`, `created_at`),
  CONSTRAINT `fk_wa_msg_contact` FOREIGN KEY (`contact_id`) REFERENCES `whatsapp_contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 24. WHATSAPP TEMPLATES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_templates` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `language` ENUM('en', 'te', 'hi') NOT NULL,
  `category` VARCHAR(50) DEFAULT 'UTILITY',
  `body` TEXT NOT NULL,
  `variables` JSON NULL,
  `approval_status` ENUM('not_submitted', 'pending', 'approved', 'rejected') DEFAULT 'not_submitted',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `wa_tpl_name_lang` (`name`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `whatsapp_templates` (`name`, `language`, `body`, `variables`, `approval_status`, `is_active`) VALUES
('enquiry_confirmation', 'en', 'Hi {{1}}, thank you for contacting ZippyTechSystems Pvt. Ltd. We have received your enquiry for {{2}} and will contact you within 24 hours.', '["name", "service"]', 'not_submitted', 1),
('enquiry_confirmation', 'te', 'నమస్తే {{1}}, ZippyTechSystems Pvt. Ltd. ని సంప్రదించినందుకు ధన్యవాదాలు. {{2}} కోసం మీ విచారణ అందింది. మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.', '["name", "service"]', 'not_submitted', 1),
('enquiry_confirmation', 'hi', 'नमस्ते {{1}}, ZippyTechSystems Pvt. Ltd. से संपर्क करने के लिए धन्यवाद। {{2}} के लिए आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।', '["name", "service"]', 'not_submitted', 1),
('follow_up', 'en', 'Hi {{1}}, this is Lingaswamy from ZippyTechSystems. Following up on your enquiry for {{2}}. Would you like to schedule a quick call today?', '["name", "service"]', 'not_submitted', 1),
('follow_up', 'te', 'నమస్తే {{1}}, ZippyTechSystems నుండి లింగస్వామి. మీ {{2}} ప్రాజెక్ట్ వివరాల గురించి మాట్లాడటానికి ఈ రోజు మీకు అనుకూలమైన సమయం చెప్పగలరా?', '["name", "service"]', 'not_submitted', 1),
('follow_up', 'hi', 'नमस्ते {{1}}, ZippyTechSystems से लिंगस्वामी। आपकी {{2}} पूछताछ के संदर्भ में, क्या आज हम फोन पर संक्षिप्त चर्चा कर सकते हैं?', '["name", "service"]', 'not_submitted', 1),
('thank_you', 'en', 'Hi {{1}}, thank you for choosing ZippyTechSystems. Your project consultation is confirmed.', '["name"]', 'not_submitted', 1),
('thank_you', 'te', 'నమస్తే {{1}}, ZippyTechSystems ను ఎంచుకున్నందుకు ధన్యవాదాలు. మీ ప్రాజెక్ట్ సంప్రదింపు ధృవీకరించబడింది.', '["name"]', 'not_submitted', 1),
('thank_you', 'hi', 'नमस्ते {{1}}, ZippyTechSystems को चुनने के लिए धन्यवाद। आपका प्रोजेक्ट परामर्श कन्फर्म हो गया है।', '["name"]', 'not_submitted', 1)
ON DUPLICATE KEY UPDATE `body` = VALUES(`body`);

-- -------------------------------------------------------------------------
-- 25. WHATSAPP AUTOMATION QUEUE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_automation_queue` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `kind` ENUM('enquiry_confirmation', 'admin_alert', 'follow_up', 'overdue_alert', 'status_update', 'daily_summary') NOT NULL,
  `enquiry_id` VARCHAR(36) NULL,
  `contact_id` BIGINT NULL,
  `template_id` BIGINT NULL,
  `payload` JSON NULL,
  `run_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `attempts` INT DEFAULT 0,
  `max_attempts` INT DEFAULT 3,
  `error` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_wa_queue_status_run` (`status`, `run_at`),
  CONSTRAINT `fk_wa_queue_contact` FOREIGN KEY (`contact_id`) REFERENCES `whatsapp_contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wa_queue_template` FOREIGN KEY (`template_id`) REFERENCES `whatsapp_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
