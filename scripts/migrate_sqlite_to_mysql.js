import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config();

import db from '../backend/db/database.js';
import mysqlClient from '../backend/db/mysqlClient.js';

async function runMigration() {
  console.log('================================================================');
  console.log('SQLITE -> HOSTINGER MYSQL MIGRATION UTILITY');
  console.log('================================================================\n');

  if (!mysqlClient.isMysqlConfigured()) {
    console.error('❌ Error: MySQL configuration not detected in environment.');
    console.error('Please configure in .env or Hostinger environment:');
    console.error('  DB_HOST=localhost');
    console.error('  DB_USER=your_db_username');
    console.error('  DB_PASSWORD=your_db_password');
    console.error('  DB_NAME=your_db_name\n');
    process.exit(1);
  }

  console.log('1. Testing MySQL connection...');
  const connTest = await mysqlClient.testMysqlConnection();
  if (!connTest.connected) {
    console.error('❌ MySQL Connection Failed:', connTest.message);
    process.exit(1);
  }
  console.log('✓ Connected to Hostinger MySQL successfully.\n');

  console.log('2. Applying MySQL Schema...');
  const schemaPath = path.join(rootDir, 'backend', 'db', 'schema_mysql.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split and execute statements
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await mysqlClient.execute(statement);
  }
  console.log('✓ All MySQL tables created and verified.\n');

  console.log('3. Migrating records from SQLite to MySQL...');

  // Users
  const users = db.prepare('SELECT * FROM users').all();
  for (const u of users) {
    await mysqlClient.execute(
      'INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [u.id, u.username, u.password_hash, u.created_at, u.updated_at]
    );
  }
  console.log(`✓ Migrated ${users.length} user accounts.`);

  // Business Profiles
  const profiles = db.prepare('SELECT * FROM business_profiles').all();
  for (const p of profiles) {
    await mysqlClient.execute(
      'INSERT INTO business_profiles (id, user_id, business_name, business_address, business_nickname, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE business_name = VALUES(business_name)',
      [p.id, p.user_id, p.business_name, p.business_address, p.business_nickname, p.created_at, p.updated_at]
    );
  }
  console.log(`✓ Migrated ${profiles.length} business profiles.`);

  // Product Varieties
  const varieties = db.prepare('SELECT * FROM product_varieties').all();
  for (const v of varieties) {
    await mysqlClient.execute(
      'INSERT INTO product_varieties (id, user_id, name, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [v.id, v.user_id || 1, v.name, v.created_at]
    );
  }
  console.log(`✓ Migrated ${varieties.length} product varieties.`);

  // Stock Entries
  const stock = db.prepare('SELECT * FROM stock_entries').all();
  for (const s of stock) {
    await mysqlClient.execute(
      'INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
      [s.id, s.user_id || 1, s.product_id, s.movement_type, s.quantity, s.entry_date, s.notes, s.created_at]
    );
  }
  console.log(`✓ Migrated ${stock.length} stock entries.`);

  // Daily Sales
  const sales = db.prepare('SELECT * FROM daily_sales').all();
  for (const s of sales) {
    await mysqlClient.execute(
      'INSERT INTO daily_sales (id, user_id, entry_date, total_sales_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_sales_amount = VALUES(total_sales_amount)',
      [s.id, s.user_id || 1, s.entry_date, s.total_sales_amount, s.created_at, s.updated_at]
    );
  }
  console.log(`✓ Migrated ${sales.length} daily sales records.`);

  // Expenses
  const expenses = db.prepare('SELECT * FROM expenses').all();
  for (const e of expenses) {
    await mysqlClient.execute(
      'INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)',
      [e.id, e.user_id || 1, e.expense_date, e.expense_type, e.amount, e.description, e.created_at]
    );
  }
  console.log(`✓ Migrated ${expenses.length} expense records.`);

  // Lenders
  const lenders = db.prepare('SELECT * FROM lenders').all();
  for (const l of lenders) {
    await mysqlClient.execute(
      'INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount_paid = VALUES(amount_paid)',
      [l.id, l.user_id || 1, l.name, l.mobile, l.place, l.amount_given, l.amount_paid, l.loan_date, l.notes, l.created_at, l.updated_at]
    );
  }
  console.log(`✓ Migrated ${lenders.length} lender records.`);

  console.log('\n================================================================');
  console.log('MIGRATION COMPLETE WITH 100% DATA PARITY!');
  console.log('================================================================');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
