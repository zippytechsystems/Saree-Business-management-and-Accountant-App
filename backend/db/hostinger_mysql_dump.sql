-- ====================================================================
-- Hostinger MySQL Complete Database & Data Dump
-- Application: Saree Business Management & Accountant App
-- Generated: 2026-10-09T11:08:31.156Z
-- Ready for 1-click phpMyAdmin Import in Hostinger
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- 1. Table Structures
-- -----------------------------------------------------
-- ====================================================================
-- Hostinger MySQL Database Schema
-- Saree Business Management & Accountant App (Version 1.0 Production)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Business Profiles
CREATE TABLE IF NOT EXISTS business_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bp_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Sessions (Multi-Device Active Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (token(191)),
    INDEX idx_session_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Varieties Catalog
CREATE TABLE IF NOT EXISTS product_varieties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pv_user_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Daily Stock Movements Log (IN / OUT)
CREATE TABLE IF NOT EXISTS stock_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    product_id INT NOT NULL,
    movement_type ENUM('IN', 'OUT') NOT NULL,
    quantity INT NOT NULL,
    entry_date VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_se_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_se_product FOREIGN KEY (product_id) REFERENCES product_varieties(id) ON DELETE RESTRICT,
    INDEX idx_se_user_date (user_id, entry_date),
    INDEX idx_se_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Daily Lump-sum Sales
CREATE TABLE IF NOT EXISTS daily_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    entry_date VARCHAR(10) NOT NULL,
    total_sales_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_sales_date (user_id, entry_date),
    INDEX idx_ds_user_date (user_id, entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Daily Categorized Expenses (5 Approved Categories)
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    expense_date VARCHAR(10) NOT NULL,
    expense_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_exp_user_date (user_id, expense_date),
    INDEX idx_exp_type (expense_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Lenders & Credit Ledger
CREATE TABLE IF NOT EXISTS lenders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    place VARCHAR(255) NOT NULL,
    amount_given DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    loan_date VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lender_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lender_user_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Sync & Mutation Audit Log
CREATE TABLE IF NOT EXISTS cloud_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    mutation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    payload TEXT NOT NULL,
    year_month VARCHAR(7) NOT NULL,
    status ENUM('pending', 'synced', 'failed') NOT NULL,
    attempts INT DEFAULT 0,
    error_message TEXT,
    idempotency_key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP NULL,
    CONSTRAINT fk_csl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_csl_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;



-- -----------------------------------------------------
-- 2. Data Inserts
-- -----------------------------------------------------

-- Data for table: users (27 records)
INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES
  (1, 'owner', 'c17a182ea8aa71c3132a1736718b65d8:76e61206742f83e74c4489b9ea81200ab3f8c1bfc9fb0382f55629800c21aa908b917eccc01c5221b0e3b732f698697956a83892775cd87b7dcb8f1f55eba48b', '2026-10-05T13:52:02.616Z', '2026-10-05T13:52:02.616Z'),
  (2, 'user_1791214816587', 'scrypt:943db3bfe0a274ab5fcf7c0fb25141dc:f8492958cdaf27532140a29c2c293da3eb580ad7b137e255960368fcfc0748a0f0cd3320aece2bc5de4b5b7ec8f95380d38ae697308e5e2bf656388828aecc4e', '2026-10-05T15:40:16.628Z', '2026-10-05T15:40:16.628Z'),
  (3, 'lingaswamy_123', 'scrypt:d55a606d3825b7b41ef9d3a2bab664f9:cc82e2a67b85b0120640420514cbe5d1a121bfe774c90a2b8cba279e0ea87b4d86fc46482de748f34fa99b14f827461e58d2c19bdfd2498ce9cd028733d62de8', '2026-10-05T15:43:25.561Z', '2026-10-05T15:43:25.561Z'),
  (4, 'user_1791216037139', 'scrypt:9d62cf0a6f4f17a0d0f607facb14e02e:539d6d1511984ee4a847c2f86043926994587f46cabfad61ff8e50a9ddeb362649bf3ea0d2d588a22ccec544dc3a93e1e128ce7529239b27e658f6fccfc657c7', '2026-10-05T16:00:37.178Z', '2026-10-05T16:00:37.178Z'),
  (5, 'user_1791217067075', 'scrypt:78486745cf2b6de4deacb4afdf0cbccd:8c6f7b4c6392789c5e5d6939262a230df7cfa6963adce10a4989a89500485f2e904c67add1448dba7d0aaff1781a2d23b5a21d77ca434c8ed7d1616dd3d2513b', '2026-10-05T16:17:47.118Z', '2026-10-05T16:17:47.118Z'),
  (6, 'user_1791217665342', 'scrypt:97970af159e2a3f3573bdce793dd676e:ddd7efa994dc5d3da9e768bfda2720d59663a8510750f068284bf1ed2d8e5b6ade006171384baf96d6063ef87cb5cf4c30b0703ad72d48fc671d8ac97d229bfd', '2026-10-05T16:27:45.382Z', '2026-10-05T16:27:45.382Z'),
  (7, 'testuser_1791480902117', 'scrypt:f7437aadf25c6a4f3f2dc807cbbcbd63:71fd8f64dfbcf3b9abe457ace6b17844ba7cb42c8726af3f2b1329c5bad9211942108d0f80317edb797c173a0425f8baf8d259a270858186a611b357f8549bba', '2026-10-08 17:35:02', '2026-10-08 17:35:02'),
  (8, 'testuser_1791480931306', 'scrypt:064367cfbcdb0a2957dc0e85fb903c8f:e6ae01ef871d52bdad13d1774d623cbff78e4b7dbda26e9b089c103e6105956fc9343d027c19a421e27e035ab0576e30456a821244af2b654f1379fef3c331bf', '2026-10-08 17:35:31', '2026-10-08 17:35:31'),
  (9, 'testuser_1791481683048', 'scrypt:7fb8de6d7a3e055fe5d63d1a19ac5af5:4636a52e69e9e8df1d73c4fbdc043d3904a70dcb304818287e3acd2060f10fdf7f775ac2705a90339ddc93d984b2a3b118f9ac6c6131c3c5d3a8213e7c058dd4', '2026-10-08 17:48:03', '2026-10-08 17:48:03'),
  (10, 'testuser_1791482638495', 'scrypt:db46a1435c8445e34f458454438bf8ce:7aeb988c2935e04d71e3b9cb309d81b979347ad73dd8e026c56dde5d27f5bc0ec96e7f9feb1449bede5480d747c4c6f6c04677e9ad159bcfcbd791029b261711', '2026-10-08 18:03:58', '2026-10-08 18:03:58'),
  (11, 'testuser_1791483224159', 'scrypt:a20fd453ae30ffb89750fad03eee82ea:9586352b81bf2bad120949ff44180d454efcc824104b145ffa0f2875de872a708fc8aaa3f030f599decf01abee261850197bd1d15895c612ebb9e112f9077478', '2026-10-08 18:13:44', '2026-10-08 18:13:44'),
  (12, 'testuser_1791483251032', 'scrypt:187076b57e8ea1fc45823b17e20c0d7d:ecedfe326149b54774991e52a682f94c0f9badb2c3ca1f1223f95b72ee89814f3d575b7d24fee7d6de3ffc78daab8b0420702d389dc774fb6cc71f1eef0e2a9a', '2026-10-08 18:14:11', '2026-10-08 18:14:11'),
  (13, 'testuser_1791483323882', 'scrypt:6fd308d0300c726dff9f1daec8cb18cd:0705fab641ac26a585baabe52c2db6b12ed9ef9df68e7906af60f58959a583839898daad90e75cf0a6dcea01aab5d824852bc8eb50018b708456efb2cfbf9871', '2026-10-08 18:15:23', '2026-10-08 18:15:23'),
  (14, 'testuser_1791484227911', 'scrypt:077dbafaf39a3f5d2aae93f70e67b08e:845a6e3d7d80aff21ebbd6ab3a34dfe486b51d2ba8f82f8553c8938765ca364595102deaabebd99bad3addf7f39ae8e6bb64f6c86cf946da88706d37034c8d47', '2026-10-08 18:30:27', '2026-10-08 18:30:27'),
  (15, 'testuser_1791486610780', 'scrypt:4178643c3daef92bbfdbdd24400b5722:8921a0024f197a9ea4aa3dda8afb7564b4eb75b77929e012d0f72c8ce474d38641689aaa3c63b38656d388cd61ead81d5ab9dfeade1784d98c628e3e98052a89', '2026-10-08 19:10:10', '2026-10-08 19:10:10'),
  (16, 'form_user_1791486667067', 'scrypt:989b796d0265208fe13f7d407effab00:8a15e9d4b30119d0617fb810ec5e9f34a2cf2ba9fdb7d28e464e8c32a429475f430276bbf679f95ad83fc604e80c41bbc3e0f5fdd11fc07507f038734802a9cb', '2026-10-08 19:11:07', '2026-10-08 19:11:07'),
  (17, 'audit_owner_1791487252070', 'scrypt:77833f2ec28d83201fb9f4b96496dbfc:a3ca9d54d1c8098844628b6ba6c06b473b3da26749efc6089d80e84f16d3b8a1d07916a2c8311055f363a163f04389a6ed63994f9ee597759ae076950179918d', '2026-10-08 19:20:52', '2026-10-08 19:20:52'),
  (18, 'testuser_1791487289318', 'scrypt:a58555c565017feeb8ed03929f9499a1:787882bf43a4b8ce1da84d2e263fe7e7f80e5134e091ee3cd491b96a09c11bc92d5df47b95ff90229cdf1fe3dc0cb0d2c426427b97b62f31fda0d0410fd744cb', '2026-10-08 19:21:29', '2026-10-08 19:21:29'),
  (19, 'testuser_1791488609709', 'scrypt:0a64ccff80eb32a5bda5e1f35d3ff549:fc3167d7fde5812649bffb81bc22329a784a4e45d2bb63b1214d4f2b1275b13ea17acd0b4ed3040416dda5a28dc247f8ef9ba6c134814a125977cd5ca093c73f', '2026-10-08 19:43:29', '2026-10-08 19:43:29'),
  (20, 'owner_1791488641918', 'scrypt:088a460f52f3fc2027169cbd69835f7c:b9bc884f8e0b8a233a6e370465be76067a8793acc4c4ab9dc19f47a62553640f9fa5e2f51729276f0ae3cacf6fd80cff4200c65d069f4b58a5630a17438778b3', '2026-10-08 19:44:01', '2026-10-08 19:44:01'),
  (21, 'owner_1791488689416', 'scrypt:8d6e94eb264acca3b2db1c7a0e899200:06b146b34428d671ba3e7ccdad8dfd3246ffbcfbe048d1c3b3d7810e5efc2f8938d262952e05b657b298f9995a1d32cba0cbdea34187b0fad81564db3eff1803', '2026-10-08 19:44:49', '2026-10-08 19:44:49'),
  (22, 'testuser_1791488697361', 'scrypt:9870fd4d9de2c587233ce6fe97e7e88d:9b8d47df5497cc0de45f1f2037244e1394538eb6783dbaff576edafa8795649c60a08dc4837b701a4a7351d0f0d4aba3ca75805ec0f143f617e0742373993aa8', '2026-10-08 19:44:57', '2026-10-08 19:44:57'),
  (23, 'owner_1791489491643', 'scrypt:4ee46478fc94e319f8ad27b630b409d2:e73f3d379cfa9d2da770b0120196765d7156e8041e97387680be41a52d0f5ff801b3846b67513a2795ecf1b12b7b5ee71a16486caedcf71c07fa63f29d1f59fb', '2026-10-08 19:58:11', '2026-10-08 19:58:11'),
  (24, 'Saree Shop #1', 'scrypt:3258c3b1c58a3d41ea2b872af27b686e:7eaf8a9b33ffa560f3df3d6e174884a5c8123d8ec741921d5d54a2f74365add3c6180df6a1ca3b4bdfd2da23b7b289aaf982f88020f3e091ca3c8cb06043a835', '2026-10-08 19:58:37', '2026-10-08 19:58:37'),
  (25, 'testuser_1791489545886', 'scrypt:69f816767e841fddd77797d4c271345a:ed195970b5307e9aaff13a1a5a9f11ff05afdb41c949afa50654baf97063a7bfaf99674e8d2a7d1506bd4d04601d07bf58ac3dcd9eb540fc3ca46eb804d01d20', '2026-10-08 19:59:05', '2026-10-08 19:59:05'),
  (26, 'owner_1791490314031', 'scrypt:8ed622dd63efb0155f620beb734770f2:bbce1ebbe9f64121a06fa141c1376efc3f52340e433083e7278c8ae0e6e303f4b40ace18dd471034eefefc94bf40ddcb239cda353b5a4b32147f9dd5b3f72738', '2026-10-08 20:11:54', '2026-10-08 20:11:54'),
  (27, 'testuser_1791528579461', 'scrypt:488de1b517aeee7285f8c43856dc567e:eb0a8f71a55fd03d1c259a3b802ce9cc1fcf487e7e315ca76570d55f3ae4e76df8005662820babdc4066ddf52e631effa2ec6b2a43b69549c8eaed4b56e472f8', '2026-10-09 06:49:39', '2026-10-09 06:49:39')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);

-- Data for table: business_profiles (27 records)
INSERT INTO business_profiles (id, user_id, business_name, business_address, business_nickname, created_at, updated_at) VALUES
  (1, 1, 'ABC Traders', 'Main Bazaar, City Commercial Hub', 'ABC Shop', '2026-10-05T13:52:02.616Z', '2026-10-05T13:52:02.616Z'),
  (2, 2, 'Metro Supermarket', '42 Commercial Boulevard', 'Metro Mart', '2026-10-05T15:40:16.647Z', '2026-10-05T15:40:16.647Z'),
  (3, 3, 'lingaswamy_123 Business', 'Main Store', 'lingaswamy_123', '2026-10-05T15:43:35.331Z', '2026-10-05T15:43:35.331Z'),
  (4, 4, 'Metro Supermarket', '42 Commercial Boulevard', 'Metro Mart', '2026-10-05T16:00:37.199Z', '2026-10-05T16:00:37.199Z'),
  (5, 5, 'Metro Supermarket', '42 Commercial Boulevard', 'Metro Mart', '2026-10-05T16:17:47.134Z', '2026-10-05T16:17:47.134Z'),
  (6, 6, 'Metro Supermarket', '42 Commercial Boulevard', 'Metro Mart', '2026-10-05T16:27:45.387Z', '2026-10-05T16:27:45.387Z'),
  (7, 7, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 17:35:02', '2026-10-08T17:35:02.168Z'),
  (8, 8, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 17:35:31', '2026-10-08T17:35:31.348Z'),
  (9, 9, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 17:48:03', '2026-10-08T17:48:03.118Z'),
  (10, 10, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 18:03:58', '2026-10-08T18:03:58.558Z'),
  (11, 11, 'testuser_1791483224159 Business', 'Main Store', 'testuser_1791483224159', '2026-10-08 18:13:44', '2026-10-08 18:13:44'),
  (12, 12, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 18:14:11', '2026-10-08T18:14:11.104Z'),
  (13, 13, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 18:15:23', '2026-10-08T18:15:23.932Z'),
  (14, 14, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 18:30:27', '2026-10-08T18:30:27.975Z'),
  (15, 15, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 19:10:10', '2026-10-08T19:10:10.821Z'),
  (16, 16, 'form_user_1791486667067 Business', 'Main Store', 'form_user_1791486667067', '2026-10-08 19:11:07', '2026-10-08 19:11:07'),
  (17, 17, 'audit_owner_1791487252070 Business', 'Main Store', 'audit_owner_1791487252070', '2026-10-08 19:20:52', '2026-10-08 19:20:52'),
  (18, 18, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 19:21:29', '2026-10-08T19:21:29.376Z'),
  (19, 19, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 19:43:29', '2026-10-08T19:43:29.751Z'),
  (20, 20, 'owner_1791488641918 Business', 'Main Store', 'owner_1791488641918', '2026-10-08 19:44:01', '2026-10-08 19:44:01'),
  (21, 21, 'owner_1791488689416 Business', 'Main Store', 'owner_1791488689416', '2026-10-08 19:44:49', '2026-10-08 19:44:49'),
  (22, 22, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 19:44:57', '2026-10-08T19:44:57.398Z'),
  (23, 23, 'owner_1791489491643 Business', 'Main Store', 'owner_1791489491643', '2026-10-08 19:58:11', '2026-10-08 19:58:11'),
  (24, 24, 'Saree Shop #1 Business', 'Main Store', 'Saree Shop #1', '2026-10-08 19:58:37', '2026-10-08 19:58:37'),
  (25, 25, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-08 19:59:05', '2026-10-08T19:59:05.925Z'),
  (26, 26, 'owner_1791490314031 Business', 'Main Store', 'owner_1791490314031', '2026-10-08 20:11:54', '2026-10-08 20:11:54'),
  (27, 27, 'E2E Test Boutique', '123 Silk Street, Surat', 'E2E Surat', '2026-10-09 06:49:39', '2026-10-09T06:49:39.498Z')
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name), business_address=VALUES(business_address), business_nickname=VALUES(business_nickname);

-- Data for table: product_varieties (16 records)
INSERT INTO product_varieties (id, user_id, name, created_at) VALUES
  (1, 1, 'Kanchipuram Pattu Saree', '2026-10-05T15:39:52.708Z'),
  (2, 2, 'Premium Rice', '2026-10-05T15:40:16.755Z'),
  (3, 4, 'Premium Rice', '2026-10-05T16:00:37.323Z'),
  (4, 5, 'Premium Rice', '2026-10-05T16:17:47.227Z'),
  (5, 6, 'Premium Rice', '2026-10-05T16:27:45.480Z'),
  (6, 8, 'Test Silk Sari 1791480931361', '2026-10-08 17:35:31'),
  (7, 9, 'Test Silk Sari 1791481683133', '2026-10-08 17:48:03'),
  (8, 10, 'Test Silk Sari 1791482638569', '2026-10-08 18:03:58'),
  (9, 13, 'Test Silk Sari 1791483323940', '2026-10-08 18:15:23'),
  (10, 14, 'Test Silk Sari 1791484227986', '2026-10-08 18:30:27'),
  (11, 15, 'Test Silk Sari 1791486610831', '2026-10-08 19:10:10'),
  (12, 18, 'Test Silk Sari 1791487289388', '2026-10-08 19:21:29'),
  (13, 19, 'Test Silk Sari 1791488609759', '2026-10-08 19:43:29'),
  (14, 22, 'Test Silk Sari 1791488697406', '2026-10-08 19:44:57'),
  (15, 25, 'Test Silk Sari 1791489545933', '2026-10-08 19:59:05'),
  (16, 27, 'Test Silk Sari 1791528579506', '2026-10-09 06:49:39')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Data for table: stock_entries (26 records)
INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at) VALUES
  (1, 2, 2, 'IN', 100, '2026-10-05', 'Initial warehouse batch', '2026-10-05T15:40:16.759Z'),
  (2, 4, 3, 'IN', 100, '2026-10-05', 'Initial warehouse batch', '2026-10-05T16:00:37.339Z'),
  (3, 5, 4, 'IN', 100, '2026-10-05', 'Initial warehouse batch', '2026-10-05T16:17:47.243Z'),
  (4, 6, 5, 'IN', 100, '2026-10-05', 'Initial warehouse batch', '2026-10-05T16:27:45.496Z'),
  (5, 8, 6, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T17:35:31.369Z'),
  (6, 8, 6, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T17:35:31.372Z'),
  (7, 9, 7, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T17:48:03.142Z'),
  (8, 9, 7, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T17:48:03.147Z'),
  (9, 10, 8, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T18:03:58.578Z'),
  (10, 10, 8, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T18:03:58.581Z'),
  (11, 13, 9, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T18:15:23.949Z'),
  (12, 13, 9, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T18:15:23.953Z'),
  (13, 14, 10, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T18:30:27.997Z'),
  (14, 14, 10, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T18:30:28.001Z'),
  (15, 15, 11, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T19:10:10.835Z'),
  (16, 15, 11, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T19:10:10.838Z'),
  (17, 18, 12, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T19:21:29.399Z'),
  (18, 18, 12, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T19:21:29.404Z'),
  (19, 19, 13, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T19:43:29.764Z'),
  (20, 19, 13, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T19:43:29.768Z'),
  (21, 22, 14, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T19:44:57.410Z'),
  (22, 22, 14, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T19:44:57.412Z'),
  (23, 25, 15, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-08T19:59:05.939Z'),
  (24, 25, 15, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-08T19:59:05.943Z'),
  (25, 27, 16, 'IN', 50, '2026-10-08', 'Initial warehouse shipment', '2026-10-09T06:49:39.510Z'),
  (26, 27, 16, 'OUT', 12, '2026-10-08', 'Store retail sales', '2026-10-09T06:49:39.515Z')
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), notes=VALUES(notes);

-- Data for table: daily_sales (19 records)
INSERT INTO daily_sales (id, user_id, entry_date, total_sales_amount, created_at, updated_at) VALUES
  (1, 1, '2026-10-05', 12500.00, '2026-10-05T15:39:38.042Z', '2026-10-05T15:39:52.781Z'),
  (2, 2, '2026-10-05', 10000.00, '2026-10-05T15:40:16.663Z', '2026-10-05T15:40:16.663Z'),
  (3, 4, '2026-10-05', 10000.00, '2026-10-05T16:00:37.208Z', '2026-10-05T16:00:37.208Z'),
  (4, 5, '2026-10-05', 10000.00, '2026-10-05T16:17:47.140Z', '2026-10-05T16:17:47.140Z'),
  (5, 6, '2026-10-05', 10000.00, '2026-10-05T16:27:45.391Z', '2026-10-05T16:27:45.391Z'),
  (6, 7, '2026-10-08', 15500.00, '2026-10-08T17:35:02.172Z', '2026-10-08T17:35:02.172Z'),
  (7, 8, '2026-10-08', 15500.00, '2026-10-08T17:35:31.353Z', '2026-10-08T17:35:31.353Z'),
  (8, 9, '2026-10-08', 15500.00, '2026-10-08T17:48:03.124Z', '2026-10-08T17:48:03.124Z'),
  (9, 10, '2026-10-08', 15500.00, '2026-10-08T18:03:58.562Z', '2026-10-08T18:03:58.562Z'),
  (10, 13, '2026-10-08', 15500.00, '2026-10-08T18:15:23.935Z', '2026-10-08T18:15:23.935Z'),
  (11, 14, '2026-10-08', 15500.00, '2026-10-08T18:30:27.979Z', '2026-10-08T18:30:27.979Z'),
  (12, 15, '2026-10-08', 15500.00, '2026-10-08T19:10:10.824Z', '2026-10-08T19:10:10.824Z'),
  (13, 16, '2026-10-09', 25000.00, '2026-10-08T19:11:07.123Z', '2026-10-08T19:11:07.123Z'),
  (14, 17, '2026-10-09', 37500.00, '2026-10-08T19:20:52.144Z', '2026-10-08T19:20:52.144Z'),
  (15, 18, '2026-10-08', 15500.00, '2026-10-08T19:21:29.381Z', '2026-10-08T19:21:29.381Z'),
  (16, 19, '2026-10-08', 15500.00, '2026-10-08T19:43:29.754Z', '2026-10-08T19:43:29.754Z'),
  (17, 22, '2026-10-08', 15500.00, '2026-10-08T19:44:57.401Z', '2026-10-08T19:44:57.401Z'),
  (18, 25, '2026-10-08', 15500.00, '2026-10-08T19:59:05.929Z', '2026-10-08T19:59:05.929Z'),
  (19, 27, '2026-10-08', 15500.00, '2026-10-09T06:49:39.501Z', '2026-10-09T06:49:39.501Z')
ON DUPLICATE KEY UPDATE total_sales_amount=VALUES(total_sales_amount);

-- Data for table: expenses (18 records)
INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at) VALUES
  (1, 1, '2026-10-05', 'Bills', 1500.00, NULL, '2026-10-05T15:39:52.789Z'),
  (2, 2, '2026-10-05', 'Rent', 2000.00, 'Monthly shop advance', '2026-10-05T15:40:16.724Z'),
  (3, 4, '2026-10-05', 'Rent', 2000.00, 'Monthly shop advance', '2026-10-05T16:00:37.293Z'),
  (4, 5, '2026-10-05', 'Rent', 2000.00, 'Monthly shop advance', '2026-10-05T16:17:47.199Z'),
  (5, 1, '2026-10-05', 'Other expenses', 150.00, 'Electricity Bill  <b onmouseover=\"alert(1)\">Paid</b>', '2026-10-05T16:26:22.169Z'),
  (6, 1, '2026-10-05', 'Other expenses', 150.00, 'Electricity Bill  <b>Paid</b>', '2026-10-05T16:27:37.200Z'),
  (7, 6, '2026-10-05', 'Rent', 2000.00, 'Monthly shop advance', '2026-10-05T16:27:45.448Z'),
  (8, 8, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T17:35:31.358Z'),
  (9, 9, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T17:48:03.130Z'),
  (10, 10, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T18:03:58.567Z'),
  (11, 13, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T18:15:23.939Z'),
  (12, 14, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T18:30:27.983Z'),
  (13, 15, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T19:10:10.829Z'),
  (14, 18, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T19:21:29.386Z'),
  (15, 19, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T19:43:29.757Z'),
  (16, 22, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T19:44:57.404Z'),
  (17, 25, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-08T19:59:05.932Z'),
  (18, 27, '2026-10-08', 'Rent', 4500.00, 'October shop advance rent', '2026-10-09T06:49:39.504Z')
ON DUPLICATE KEY UPDATE amount=VALUES(amount), description=VALUES(description);

-- Data for table: lenders (11 records)
INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at) VALUES
  (1, 8, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T17:35:31.382Z', '2026-10-08T17:35:31.390Z'),
  (2, 9, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T17:48:03.155Z', '2026-10-08T17:48:03.161Z'),
  (3, 10, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T18:03:58.588Z', '2026-10-08T18:03:58.596Z'),
  (4, 13, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T18:15:23.959Z', '2026-10-08T18:15:23.965Z'),
  (5, 14, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T18:30:28.009Z', '2026-10-08T18:30:28.015Z'),
  (6, 15, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T19:10:10.843Z', '2026-10-08T19:10:10.848Z'),
  (7, 18, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T19:21:29.411Z', '2026-10-08T19:21:29.417Z'),
  (8, 19, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T19:43:29.775Z', '2026-10-08T19:43:29.780Z'),
  (9, 22, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T19:44:57.416Z', '2026-10-08T19:44:57.420Z'),
  (10, 25, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-08T19:59:05.949Z', '2026-10-08T19:59:05.957Z'),
  (11, 27, 'Ramesh Patel', '9876543210', 'Surat Market', 10000.00, 5000.00, '2026-10-08', 'Festival advance loan', '2026-10-09T06:49:39.520Z', '2026-10-09T06:49:39.524Z')
ON DUPLICATE KEY UPDATE amount_paid=VALUES(amount_paid), notes=VALUES(notes);

SET FOREIGN_KEY_CHECKS = 1;
-- Dump complete.
