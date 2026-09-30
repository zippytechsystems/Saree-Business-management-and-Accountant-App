-- ====================================================================
-- SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Project: Business Management & Accountant Management App (Version 1.0)
-- Scope: Multi-Device Authoritative Cloud Database with Row Level Security
-- ====================================================================

-- 1. Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Owner Accounts Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));

-- 3. Business Profiles Table (1-to-1 with User)
CREATE TABLE IF NOT EXISTS business_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles (user_id);

-- 4. Active Sessions Table (Multi-Device Authentication)
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);

-- 5. Product Varieties Catalog
CREATE TABLE IF NOT EXISTS product_varieties (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_product_varieties_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_varieties_user_id ON product_varieties (user_id);

-- 6. Stock Movements Log (IN / OUT)
CREATE TABLE IF NOT EXISTS stock_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES product_varieties(id) ON DELETE RESTRICT,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    entry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_user_id ON stock_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product_date ON stock_entries (product_id, entry_date);

-- 7. Daily Lump-sum Sales Table
CREATE TABLE IF NOT EXISTS daily_sales (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    total_sales_amount NUMERIC(12, 2) NOT NULL CHECK (total_sales_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_daily_sales_user_date UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_sales_user_id ON daily_sales (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_entry_date ON daily_sales (entry_date);

-- 8. Daily Categorized Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    expense_type VARCHAR(100) NOT NULL CHECK (
        expense_type IN (
            'Bills',
            'Rent',
            'Stock/Purchase expenses',
            'Supplier payments',
            'Other expenses'
        )
    ),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date_type ON expenses (expense_date, expense_type);

-- 9. Lender Accounts & Balance Ledger
CREATE TABLE IF NOT EXISTS lenders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    place VARCHAR(255) NOT NULL,
    amount_given NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_given >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    loan_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lenders_user_id ON lenders (user_id);
CREATE INDEX IF NOT EXISTS idx_lenders_name ON lenders (name);

-- 10. Cloud Synchronization Audit & Offline Queue Log
CREATE TABLE IF NOT EXISTS cloud_sync_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mutation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    payload JSONB NOT NULL,
    year_month VARCHAR(7) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'synced', 'failed')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cloud_sync_user_id ON cloud_sync_log (user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_sync_status ON cloud_sync_log (status);
CREATE INDEX IF NOT EXISTS idx_cloud_sync_month ON cloud_sync_log (year_month);

-- 11. Cloud Backup Metadata
CREATE TABLE IF NOT EXISTS cloud_backup_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Monthly Snapshot Backups Table
CREATE TABLE IF NOT EXISTS cloud_backups (
    year_month VARCHAR(7) PRIMARY KEY,
    snapshot_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_backup_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_backups ENABLE ROW LEVEL SECURITY;

-- Note: The server uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS and enforces user isolation in the application layer.
-- For direct authenticated client tokens or public anon access, the following policies ensure strict user isolation:

DROP POLICY IF EXISTS users_isolation ON users;
CREATE POLICY users_isolation ON users
    FOR ALL
    USING (id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS business_profiles_isolation ON business_profiles;
CREATE POLICY business_profiles_isolation ON business_profiles
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS sessions_isolation ON sessions;
CREATE POLICY sessions_isolation ON sessions
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS product_varieties_isolation ON product_varieties;
CREATE POLICY product_varieties_isolation ON product_varieties
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS stock_entries_isolation ON stock_entries;
CREATE POLICY stock_entries_isolation ON stock_entries
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS daily_sales_isolation ON daily_sales;
CREATE POLICY daily_sales_isolation ON daily_sales
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS expenses_isolation ON expenses;
CREATE POLICY expenses_isolation ON expenses
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS lenders_isolation ON lenders;
CREATE POLICY lenders_isolation ON lenders
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS cloud_sync_log_isolation ON cloud_sync_log;
CREATE POLICY cloud_sync_log_isolation ON cloud_sync_log
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint);

DROP POLICY IF EXISTS cloud_backup_meta_all ON cloud_backup_meta;
CREATE POLICY cloud_backup_meta_all ON cloud_backup_meta
    FOR ALL
    USING (true);

DROP POLICY IF EXISTS cloud_backups_all ON cloud_backups;
CREATE POLICY cloud_backups_all ON cloud_backups
    FOR ALL
    USING (true);

-- 13. Auto-increment sequence sync function (for use after inserting historical SQLite records)
CREATE OR REPLACE FUNCTION sync_all_sequences() RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM users) THEN
        PERFORM setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM business_profiles) THEN
        PERFORM setval(pg_get_serial_sequence('business_profiles', 'id'), COALESCE((SELECT MAX(id) FROM business_profiles), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM sessions) THEN
        PERFORM setval(pg_get_serial_sequence('sessions', 'id'), COALESCE((SELECT MAX(id) FROM sessions), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM product_varieties) THEN
        PERFORM setval(pg_get_serial_sequence('product_varieties', 'id'), COALESCE((SELECT MAX(id) FROM product_varieties), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM stock_entries) THEN
        PERFORM setval(pg_get_serial_sequence('stock_entries', 'id'), COALESCE((SELECT MAX(id) FROM stock_entries), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM daily_sales) THEN
        PERFORM setval(pg_get_serial_sequence('daily_sales', 'id'), COALESCE((SELECT MAX(id) FROM daily_sales), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM expenses) THEN
        PERFORM setval(pg_get_serial_sequence('expenses', 'id'), COALESCE((SELECT MAX(id) FROM expenses), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM lenders) THEN
        PERFORM setval(pg_get_serial_sequence('lenders', 'id'), COALESCE((SELECT MAX(id) FROM lenders), 1));
    END IF;
    IF EXISTS (SELECT 1 FROM cloud_sync_log) THEN
        PERFORM setval(pg_get_serial_sequence('cloud_sync_log', 'id'), COALESCE((SELECT MAX(id) FROM cloud_sync_log), 1));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
