-- Optional Production Launch Cleanup Script
-- Use ONLY if you wish to reset all development test entries to zero before real-world store opening.
-- WARNING: This will clear test sales, test expenses, test movements, and test lenders.

-- To perform a clean reset, execute this in sqlite3:
-- sqlite3 data/app.db < backend/db/cleanupTestData.sql

BEGIN TRANSACTION;

-- Clean stock movements & test varieties (leaving standard base varieties if desired)
DELETE FROM stock_entries WHERE product_id NOT IN (1, 2, 3) OR notes LIKE '%test%' OR notes LIKE '%QA%';
DELETE FROM product_varieties WHERE id NOT IN (1, 2, 3);

-- Clean test sales from isolated test dates
DELETE FROM daily_sales WHERE entry_date LIKE '2025-%';

-- Clean test expenses created during automated test suites
DELETE FROM expenses WHERE description LIKE '%test%' OR description LIKE '%QA%' OR expense_date LIKE '2025-%';

-- Clean test lenders generated with timestamps
DELETE FROM lenders WHERE name LIKE 'QA Lender%' OR name LIKE '%1790671%';

COMMIT;
