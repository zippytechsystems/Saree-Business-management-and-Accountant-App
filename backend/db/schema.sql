-- Database Schema for Business Management & Accountant Management App (Version 1.0 Production Release)
-- Engine: SQLite with WAL mode enabled & Multi-Device Cloud-Linked User Scoping

PRAGMA foreign_keys = ON;

-- 0. Authentication: Owner Accounts
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 0.1 Business Profile Setup
CREATE TABLE IF NOT EXISTS business_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_address TEXT NOT NULL,
    business_nickname TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 0.2 Active Authentication Sessions (Multi-Device)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1. Product Varieties Catalog
CREATE TABLE IF NOT EXISTS product_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    name TEXT NOT NULL COLLATE NOCASE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daily Stock Movement Log (IN / OUT)
CREATE TABLE IF NOT EXISTS stock_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    product_id INTEGER NOT NULL REFERENCES product_varieties(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK(movement_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    entry_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Lump-sum Sales Table
CREATE TABLE IF NOT EXISTS daily_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    entry_date TEXT NOT NULL,
    total_sales_amount REAL NOT NULL CHECK(total_sales_amount >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Daily Categorized Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    expense_date TEXT NOT NULL,
    expense_type TEXT NOT NULL CHECK(
        expense_type IN (
            'Bills',
            'Rent',
            'Stock/Purchase expenses',
            'Supplier payments',
            'Other expenses'
        )
    ),
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Lender Accounts & Balance Ledger
CREATE TABLE IF NOT EXISTS lenders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    place TEXT NOT NULL,
    amount_given REAL NOT NULL DEFAULT 0.0 CHECK(amount_given >= 0),
    amount_paid REAL NOT NULL DEFAULT 0.0 CHECK(amount_paid >= 0),
    loan_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast date and owner filtering
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user ON business_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_product_date ON stock_entries(product_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(entry_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date_type ON expenses(expense_date, expense_type);
CREATE INDEX IF NOT EXISTS idx_lenders_name ON lenders(name);

-- 6. Automatic Cloud Backup Sync Log (Queue & History)
CREATE TABLE IF NOT EXISTS cloud_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    mutation_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    payload TEXT NOT NULL,
    year_month TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'synced', 'failed')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
);

-- 7. Cloud Backup Metadata
CREATE TABLE IF NOT EXISTS cloud_backup_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cloud_sync_status ON cloud_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_cloud_sync_month ON cloud_sync_log(year_month);
