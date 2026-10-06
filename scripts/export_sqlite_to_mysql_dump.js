import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../backend/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'backend', 'db', 'hostinger_mysql_dump.sql');

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%': return '\\' + char;
      default: return char;
    }
  });
  return `'${str}'`;
}

function generateDump() {
  console.log('Generating Hostinger MySQL dump from SQLite data...');

  const schemaPath = path.join(rootDir, 'backend', 'db', 'schema_mysql.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  let dump = `-- ====================================================================\n`;
  dump += `-- Hostinger MySQL Complete Database & Data Dump\n`;
  dump += `-- Application: Saree Business Management & Accountant App\n`;
  dump += `-- Generated: ${new Date().toISOString()}\n`;
  dump += `-- Ready for 1-click phpMyAdmin Import in Hostinger\n`;
  dump += `-- ====================================================================\n\n`;
  dump += `SET NAMES utf8mb4;\n`;
  dump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  dump += `-- -----------------------------------------------------\n`;
  dump += `-- 1. Table Structures\n`;
  dump += `-- -----------------------------------------------------\n`;
  dump += schemaSql + '\n\n';

  dump += `-- -----------------------------------------------------\n`;
  dump += `-- 2. Data Inserts\n`;
  dump += `-- -----------------------------------------------------\n\n`;

  // 1. Users
  const users = db.prepare('SELECT * FROM users').all();
  if (users.length > 0) {
    dump += `-- Data for table: users (${users.length} records)\n`;
    dump += `INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES\n`;
    const userRows = users.map(u => 
      `  (${u.id}, ${escapeSql(u.username)}, ${escapeSql(u.password_hash)}, ${escapeSql(u.created_at)}, ${escapeSql(u.updated_at)})`
    );
    dump += userRows.join(',\n') + `\nON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);\n\n`;
  }

  // 2. Business Profiles
  const profiles = db.prepare('SELECT * FROM business_profiles').all();
  if (profiles.length > 0) {
    dump += `-- Data for table: business_profiles (${profiles.length} records)\n`;
    dump += `INSERT INTO business_profiles (id, user_id, business_name, business_address, business_nickname, created_at, updated_at) VALUES\n`;
    const profileRows = profiles.map(p => 
      `  (${p.id}, ${p.user_id}, ${escapeSql(p.business_name)}, ${escapeSql(p.business_address)}, ${escapeSql(p.business_nickname)}, ${escapeSql(p.created_at)}, ${escapeSql(p.updated_at)})`
    );
    dump += profileRows.join(',\n') + `\nON DUPLICATE KEY UPDATE business_name=VALUES(business_name), business_address=VALUES(business_address), business_nickname=VALUES(business_nickname);\n\n`;
  }

  // 3. Product Varieties
  const varieties = db.prepare('SELECT * FROM product_varieties').all();
  if (varieties.length > 0) {
    dump += `-- Data for table: product_varieties (${varieties.length} records)\n`;
    dump += `INSERT INTO product_varieties (id, user_id, name, created_at) VALUES\n`;
    const varietyRows = varieties.map(v => 
      `  (${v.id}, ${v.user_id || 1}, ${escapeSql(v.name)}, ${escapeSql(v.created_at)})`
    );
    dump += varietyRows.join(',\n') + `\nON DUPLICATE KEY UPDATE name=VALUES(name);\n\n`;
  }

  // 4. Stock Entries
  const stock = db.prepare('SELECT * FROM stock_entries').all();
  if (stock.length > 0) {
    dump += `-- Data for table: stock_entries (${stock.length} records)\n`;
    dump += `INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at) VALUES\n`;
    const stockRows = stock.map(s => 
      `  (${s.id}, ${s.user_id || 1}, ${s.product_id}, ${escapeSql(s.movement_type)}, ${s.quantity}, ${escapeSql(s.entry_date)}, ${escapeSql(s.notes)}, ${escapeSql(s.created_at)})`
    );
    dump += stockRows.join(',\n') + `\nON DUPLICATE KEY UPDATE quantity=VALUES(quantity), notes=VALUES(notes);\n\n`;
  }

  // 5. Daily Sales
  const sales = db.prepare('SELECT * FROM daily_sales').all();
  if (sales.length > 0) {
    dump += `-- Data for table: daily_sales (${sales.length} records)\n`;
    dump += `INSERT INTO daily_sales (id, user_id, entry_date, total_sales_amount, created_at, updated_at) VALUES\n`;
    const salesRows = sales.map(s => 
      `  (${s.id}, ${s.user_id || 1}, ${escapeSql(s.entry_date)}, ${Number(s.total_sales_amount).toFixed(2)}, ${escapeSql(s.created_at)}, ${escapeSql(s.updated_at)})`
    );
    dump += salesRows.join(',\n') + `\nON DUPLICATE KEY UPDATE total_sales_amount=VALUES(total_sales_amount);\n\n`;
  }

  // 6. Expenses
  const expenses = db.prepare('SELECT * FROM expenses').all();
  if (expenses.length > 0) {
    dump += `-- Data for table: expenses (${expenses.length} records)\n`;
    dump += `INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at) VALUES\n`;
    const expenseRows = expenses.map(e => 
      `  (${e.id}, ${e.user_id || 1}, ${escapeSql(e.expense_date)}, ${escapeSql(e.expense_type)}, ${Number(e.amount).toFixed(2)}, ${escapeSql(e.description)}, ${escapeSql(e.created_at)})`
    );
    dump += expenseRows.join(',\n') + `\nON DUPLICATE KEY UPDATE amount=VALUES(amount), description=VALUES(description);\n\n`;
  }

  // 7. Lenders
  const lenders = db.prepare('SELECT * FROM lenders').all();
  if (lenders.length > 0) {
    dump += `-- Data for table: lenders (${lenders.length} records)\n`;
    dump += `INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at) VALUES\n`;
    const lenderRows = lenders.map(l => 
      `  (${l.id}, ${l.user_id || 1}, ${escapeSql(l.name)}, ${escapeSql(l.mobile)}, ${escapeSql(l.place)}, ${Number(l.amount_given).toFixed(2)}, ${Number(l.amount_paid).toFixed(2)}, ${escapeSql(l.loan_date)}, ${escapeSql(l.notes)}, ${escapeSql(l.created_at)}, ${escapeSql(l.updated_at)})`
    );
    dump += lenderRows.join(',\n') + `\nON DUPLICATE KEY UPDATE amount_paid=VALUES(amount_paid), notes=VALUES(notes);\n\n`;
  }

  dump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  dump += `-- Dump complete.\n`;

  fs.writeFileSync(outputFile, dump, 'utf8');
  console.log(`✓ Dump file created successfully at:\n  ${outputFile}`);
  console.log(`  File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
}

generateDump();
