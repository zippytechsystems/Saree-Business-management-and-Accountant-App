import db from '../db/database.js';

console.log('--- DB PRAGMAS ---');
console.log('journal_mode:', db.prepare('PRAGMA journal_mode;').get());
console.log('foreign_keys:', db.prepare('PRAGMA foreign_keys;').get());
console.log('integrity_check:', db.prepare('PRAGMA integrity_check;').get());
console.log('foreign_key_check:', db.prepare('PRAGMA foreign_key_check;').all());

console.log('\n--- TABLE COUNTS ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM ${t.name}`).get().c;
  console.log(`  ${t.name}: ${count} rows`);
}

console.log('\n--- ORPHAN CHECKS ---');
const orphanedStock = db.prepare('SELECT COUNT(*) as c FROM stock_entries WHERE product_id NOT IN (SELECT id FROM product_varieties)').get().c;
console.log('Orphaned stock entries:', orphanedStock);

console.log('\n--- CALCULATION AUDIT (ACTUAL DB ROWS) ---');
// 1. Current stock
const inStock = db.prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM stock_entries WHERE movement_type = 'IN'").get().total;
const outStock = db.prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM stock_entries WHERE movement_type = 'OUT'").get().total;
console.log(`Stock: IN=${inStock}, OUT=${outStock}, Net=${inStock - outStock}`);

// 2. Lenders
const lendersSum = db.prepare("SELECT COALESCE(SUM(amount_given), 0) AS given, COALESCE(SUM(amount_paid), 0) AS paid FROM lenders").get();
console.log(`Lenders: Given=${lendersSum.given}, Paid=${lendersSum.paid}, Due=${lendersSum.given - lendersSum.paid}`);

// 3. Expenses for 2026-09
const expSum = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date LIKE '2026-09%'").get().total;
const catBreakdown = db.prepare("SELECT expense_type, SUM(amount) AS total FROM expenses WHERE expense_date LIKE '2026-09%' GROUP BY expense_type").all();
const sumCategories = catBreakdown.reduce((a, b) => a + b.total, 0);
console.log(`Expenses (2026-09): Total=${expSum}, CategorySum=${sumCategories}, Difference=${expSum - sumCategories}`);

// 4. Sales for 2026-09
const salesSum = db.prepare("SELECT COALESCE(SUM(total_sales_amount), 0) AS total FROM daily_sales WHERE entry_date LIKE '2026-09%'").get().total;
console.log(`Sales (2026-09): Total=${salesSum}`);
console.log(`Monthly Turnover (Turnover = Sales): ${salesSum}`);
console.log(`Monthly Net Balance (Sales - Expenses): ${salesSum - expSum}`);
