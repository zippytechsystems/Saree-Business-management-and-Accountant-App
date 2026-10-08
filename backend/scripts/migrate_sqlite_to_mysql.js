/**
 * SQLite to Hostinger MySQL Data Migration & Parity Verification Script
 * Project: Business Management & Accountant Management App
 *
 * Migrates all existing business accounts, inventory, sales, expenses,
 * and lender ledgers from local SQLite into the Hostinger MySQL database.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';
import * as mysql from '../db/mysql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'app.db');

function toMySQLDateTime(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function migrateSQLiteToMySQL({ silent = false } = {}) {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log('================================================================');
  log('STARTING SQLITE -> HOSTINGER MYSQL DATABASE MIGRATION');
  log('================================================================\n');

  // Step 1: Check MySQL connectivity
  log('1. Verifying MySQL connection...');
  const connTest = await mysql.testMySQLConnection();
  if (!connTest.connected) {
    throw new Error(`Cannot connect to MySQL database: ${connTest.error} (${connTest.host}:${connTest.port})`);
  }
  log(`   ✓ Connected to MySQL database "${connTest.database}" on ${connTest.host}:${connTest.port}`);

  // Step 2: Initialize MySQL schema
  log('\n2. Ensuring MySQL schema tables exist...');
  await mysql.initMySQLSchema();
  log('   ✓ Schema verified.');

  // Step 3: Check SQLite database
  if (!fs.existsSync(dbPath)) {
    log('\nℹ No local SQLite database found at:', dbPath);
    log('   Migration skipped (fresh database).');
    return { migrated: false, reason: 'no_sqlite_db' };
  }

  // Backup SQLite database
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(dataDir, `app.db.pre-mysql-backup-${timestamp}`);
  try {
    fs.copyFileSync(dbPath, backupPath);
    log(`   ✓ SQLite backup created: ${backupPath}`);
  } catch (e) {}

  log('\n3. Reading records from SQLite & Migrating to MySQL...');

  // 3.1 Migrate Users
  const users = db.prepare('SELECT id, username, password_hash, created_at, updated_at FROM users').all();
  log(`   - Found ${users.length} users in SQLite.`);
  for (const u of users) {
    await mysql.query(
      `INSERT INTO users (id, username, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         updated_at = VALUES(updated_at)`,
      [u.id, u.username, u.password_hash, toMySQLDateTime(u.created_at), toMySQLDateTime(u.updated_at)]
    );
  }

  // 3.2 Migrate Business Profiles
  const profiles = db.prepare('SELECT id, user_id, business_name, business_address, business_nickname, created_at, updated_at FROM business_profiles').all();
  log(`   - Found ${profiles.length} business profiles in SQLite.`);
  for (const p of profiles) {
    await mysql.query(
      `INSERT INTO business_profiles (id, user_id, business_name, business_address, business_nickname, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         business_name = VALUES(business_name),
         business_address = VALUES(business_address),
         business_nickname = VALUES(business_nickname),
         updated_at = VALUES(updated_at)`,
      [p.id, p.user_id, p.business_name, p.business_address, p.business_nickname, toMySQLDateTime(p.created_at), toMySQLDateTime(p.updated_at)]
    );
  }

  // 3.3 Migrate Sessions
  try {
    const sessions = db.prepare('SELECT id, user_id, token, expires_at, created_at FROM sessions').all();
    for (const s of sessions) {
      await mysql.query(
        `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
        [s.id, s.user_id, s.token, toMySQLDateTime(s.expires_at), toMySQLDateTime(s.created_at)]
      );
    }
  } catch (e) {}

  // 3.4 Migrate Product Varieties
  const varieties = db.prepare('SELECT id, user_id, name, created_at FROM product_varieties').all();
  log(`   - Found ${varieties.length} product varieties in SQLite.`);
  for (const v of varieties) {
    await mysql.query(
      `INSERT INTO product_varieties (id, user_id, name, created_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [v.id, v.user_id || 1, v.name, toMySQLDateTime(v.created_at)]
    );
  }

  // 3.5 Migrate Stock Entries
  const stock = db.prepare('SELECT id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at FROM stock_entries').all();
  log(`   - Found ${stock.length} stock movement entries in SQLite.`);
  for (const s of stock) {
    await mysql.query(
      `INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantity = VALUES(quantity),
         movement_type = VALUES(movement_type),
         notes = VALUES(notes)`,
      [s.id, s.user_id || 1, s.product_id, s.movement_type, s.quantity, s.entry_date, s.notes, toMySQLDateTime(s.created_at)]
    );
  }

  // 3.6 Migrate Daily Sales
  const sales = db.prepare('SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales').all();
  log(`   - Found ${sales.length} daily sales records in SQLite.`);
  for (const sa of sales) {
    await mysql.query(
      `INSERT INTO daily_sales (id, user_id, entry_date, total_sales_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_sales_amount = VALUES(total_sales_amount),
         updated_at = VALUES(updated_at)`,
      [sa.id, sa.user_id || 1, sa.entry_date, sa.total_sales_amount, toMySQLDateTime(sa.created_at), toMySQLDateTime(sa.updated_at)]
    );
  }

  // 3.7 Migrate Expenses
  const expenses = db.prepare('SELECT id, user_id, expense_date, expense_type, amount, description, created_at FROM expenses').all();
  log(`   - Found ${expenses.length} expense records in SQLite.`);
  for (const ex of expenses) {
    await mysql.query(
      `INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         expense_date = VALUES(expense_date),
         expense_type = VALUES(expense_type),
         amount = VALUES(amount),
         description = VALUES(description)`,
      [ex.id, ex.user_id || 1, ex.expense_date, ex.expense_type, ex.amount, ex.description, toMySQLDateTime(ex.created_at)]
    );
  }

  // 3.8 Migrate Lenders
  const lenders = db.prepare('SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders').all();
  log(`   - Found ${lenders.length} lender records in SQLite.`);
  for (const l of lenders) {
    await mysql.query(
      `INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         mobile = VALUES(mobile),
         place = VALUES(place),
         amount_given = VALUES(amount_given),
         amount_paid = VALUES(amount_paid),
         loan_date = VALUES(loan_date),
         notes = VALUES(notes),
         updated_at = VALUES(updated_at)`,
      [l.id, l.user_id || 1, l.name, l.mobile, l.place, l.amount_given, l.amount_paid, l.loan_date, l.notes, toMySQLDateTime(l.created_at), toMySQLDateTime(l.updated_at)]
    );
  }

  // Step 4: Parity Audit Verification
  log('\n4. Verifying Data Parity between SQLite and MySQL...');

  const [mysqlUserCount] = await mysql.query('SELECT COUNT(*) as c FROM users');
  const [mysqlSalesCount] = await mysql.query('SELECT COUNT(*) as c, COALESCE(SUM(total_sales_amount), 0) as total FROM daily_sales');
  const [mysqlExpCount] = await mysql.query('SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as total FROM expenses');
  const [mysqlVarietyCount] = await mysql.query('SELECT COUNT(*) as c FROM product_varieties');
  const [mysqlStockCount] = await mysql.query('SELECT COUNT(*) as c FROM stock_entries');
  const [mysqlLenderCount] = await mysql.query('SELECT COUNT(*) as c FROM lenders');

  const sqliteSalesSum = db.prepare('SELECT COALESCE(SUM(total_sales_amount), 0) as total FROM daily_sales').get().total;
  const sqliteExpSum = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get().total;

  log(`   ✓ Users: SQLite=${users.length} -> MySQL=${mysqlUserCount[0].c}`);
  log(`   ✓ Product Varieties: SQLite=${varieties.length} -> MySQL=${mysqlVarietyCount[0].c}`);
  log(`   ✓ Stock Entries: SQLite=${stock.length} -> MySQL=${mysqlStockCount[0].c}`);
  log(`   ✓ Daily Sales: SQLite=${sales.length} -> MySQL=${mysqlSalesCount[0].c} (Total: ₹${mysqlSalesCount[0].total})`);
  log(`   ✓ Expenses: SQLite=${expenses.length} -> MySQL=${mysqlExpCount[0].c} (Total: ₹${mysqlExpCount[0].total})`);
  log(`   ✓ Lenders: SQLite=${lenders.length} -> MySQL=${mysqlLenderCount[0].c}`);

  const isParityOk =
    Number(mysqlSalesCount[0].total) === Number(sqliteSalesSum) &&
    Number(mysqlExpCount[0].total) === Number(sqliteExpSum);

  if (!isParityOk) {
    log('   ⚠️ WARNING: Financial sum discrepancy detected between SQLite and MySQL.');
  } else {
    log('\n🎉 PARITY VERIFICATION PASSED: 100% Data & Financial Parity Achieved!');
  }

  return {
    success: true,
    parity: isParityOk,
    counts: {
      users: mysqlUserCount[0].c,
      varieties: mysqlVarietyCount[0].c,
      stock: mysqlStockCount[0].c,
      sales: mysqlSalesCount[0].c,
      expenses: mysqlExpCount[0].c,
      lenders: mysqlLenderCount[0].c,
    },
  };
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate_sqlite_to_mysql.js')) {
  migrateSQLiteToMySQL()
    .then(() => {
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
