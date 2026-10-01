import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runAuthMigration() {
  console.log('[Migration] Starting Authentication & Multi-Device Schema Migration...');

  // 1. Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create business_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      business_address TEXT NOT NULL,
      business_nickname TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create sessions table for active tokens & logout
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // 4. Ensure initial primary owner exists for existing business data
  const existingOwner = db.prepare('SELECT id, username FROM users WHERE id = 1').get();
  if (!existingOwner) {
    // Hash default password for initial owner: "Owner@123"
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('Owner@123', salt, 64).toString('hex');
    const passwordHash = `${salt}:${hash}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at, updated_at)
      VALUES (1, 'owner', ?, ?, ?)
    `).run(passwordHash, now, now);

    // Initial business profile
    db.prepare(`
      INSERT OR IGNORE INTO business_profiles (user_id, business_name, business_address, business_nickname, created_at, updated_at)
      VALUES (1, 'ABC Traders', 'Main Bazaar, City Commercial Hub', 'ABC Shop', ?, ?)
    `).run(now, now);

    console.log('[Migration] Created initial default business owner (username: "owner", id: 1)');
  }

  // 5. Add user_id column to existing business tables if not already present
  const tables = [
    'product_varieties',
    'stock_entries',
    'daily_sales',
    'expenses',
    'lenders',
    'cloud_sync_log'
  ];

  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table});`).all().map(c => c.name);
    if (columns.length > 0 && !columns.includes('user_id')) {
      console.log(`[Migration] Adding user_id column to ${table}...`);
      db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER DEFAULT 1;`);
      // Update any existing rows to point to user_id = 1
      db.exec(`UPDATE ${table} SET user_id = 1 WHERE user_id IS NULL;`);
    }
  }

  // 6. Create indexes on user_id for high performance multi-device data scoping
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_product_varieties_user ON product_varieties(user_id);
    CREATE INDEX IF NOT EXISTS idx_stock_entries_user ON stock_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_sales_user ON daily_sales(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id, expense_date);
    CREATE INDEX IF NOT EXISTS idx_lenders_user ON lenders(user_id);
    CREATE INDEX IF NOT EXISTS idx_cloud_sync_log_user ON cloud_sync_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_cloud_sync_user ON cloud_sync_log(user_id);
  `);

  // 6.1 Ensure idempotency_key exists on cloud_sync_log
  const syncCols = db.prepare('PRAGMA table_info(cloud_sync_log)').all().map(c => c.name);
  if (!syncCols.includes('idempotency_key')) {
    db.exec('ALTER TABLE cloud_sync_log ADD COLUMN idempotency_key TEXT;');
    db.exec('CREATE INDEX IF NOT EXISTS idx_cloud_sync_idempotency ON cloud_sync_log(idempotency_key);');
  }

  // 7. Migrate daily_sales and product_varieties to scoped UNIQUE constraints if needed
  const salesIndexes = db.prepare('PRAGMA index_list(daily_sales)').all();
  const hasGlobalSalesUnique = salesIndexes.some((idx) => {
    if (!idx.unique) return false;
    const cols = db.prepare(`PRAGMA index_info(${idx.name})`).all().map((c) => c.name);
    return cols.length === 1 && cols[0] === 'entry_date';
  });

  if (hasGlobalSalesUnique) {
    console.log('[Migration] Migrating daily_sales to composite UNIQUE(user_id, entry_date)...');
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS daily_sales_scoped (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
        entry_date TEXT NOT NULL,
        total_sales_amount REAL NOT NULL CHECK(total_sales_amount >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, entry_date)
      );
      INSERT OR REPLACE INTO daily_sales_scoped (id, user_id, entry_date, total_sales_amount, created_at, updated_at)
        SELECT id, COALESCE(user_id, 1), entry_date, total_sales_amount, created_at, updated_at FROM daily_sales;
      DROP TABLE daily_sales;
      ALTER TABLE daily_sales_scoped RENAME TO daily_sales;
      CREATE INDEX IF NOT EXISTS idx_daily_sales_user ON daily_sales(user_id, entry_date);
      CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(entry_date);
      PRAGMA foreign_keys = ON;
    `);
  }

  const varietyIndexes = db.prepare('PRAGMA index_list(product_varieties)').all();
  const hasGlobalVarietyUnique = varietyIndexes.some((idx) => {
    if (!idx.unique) return false;
    const cols = db.prepare(`PRAGMA index_info(${idx.name})`).all().map((c) => c.name);
    return cols.length === 1 && cols[0] === 'name';
  });

  if (hasGlobalVarietyUnique) {
    console.log('[Migration] Migrating product_varieties to composite UNIQUE(user_id, name COLLATE NOCASE)...');
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS product_varieties_scoped (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name COLLATE NOCASE)
      );
      INSERT OR REPLACE INTO product_varieties_scoped (id, user_id, name, created_at)
        SELECT id, COALESCE(user_id, 1), name, created_at FROM product_varieties;
      DROP TABLE product_varieties;
      ALTER TABLE product_varieties_scoped RENAME TO product_varieties;
      CREATE INDEX IF NOT EXISTS idx_product_varieties_user ON product_varieties(user_id);
      PRAGMA foreign_keys = ON;
    `);
  }

  console.log('[Migration] Authentication & Multi-Device Schema Migration completed successfully.');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('migration_auth.js')) {
  runAuthMigration();
  const integrity = db.prepare('PRAGMA integrity_check;').get();
  console.log('[Migration Check] PRAGMA integrity_check:', integrity.integrity_check);
  const fk = db.prepare('PRAGMA foreign_key_check;').all();
  console.log('[Migration Check] PRAGMA foreign_key_check violations:', fk.length);
}
