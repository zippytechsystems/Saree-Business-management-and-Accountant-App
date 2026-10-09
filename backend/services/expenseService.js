import db from '../db/database.js';
import { getTodayDateString, isValidDateString } from './salesService.js';

export const APPROVED_EXPENSE_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

/**
 * Validate expense input
 */
function validateExpenseInput({ expense_date, expense_type, amount }) {
  if (!expense_date || !isValidDateString(expense_date)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  if (!expense_type || !APPROVED_EXPENSE_CATEGORIES.includes(expense_type)) {
    throw new Error(
      `Invalid expense type. Allowed categories: ${APPROVED_EXPENSE_CATEGORIES.join(', ')}`
    );
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Expense amount must be a number strictly greater than 0.');
  }
}

/**
 * Add a new expense scoped to authenticated owner
 */
export function addExpense({ expense_date, expense_type, amount, description = '', userId }, secondArg = 1) {
  validateExpenseInput({ expense_date, expense_type, amount });

  const numAmount = Number(amount);
  const cleanDesc = description ? String(description).trim() : null;
  const now = new Date().toISOString();
  const uid = Number(userId || secondArg || 1);

  const result = db.prepare(
    `INSERT INTO expenses (user_id, expense_date, expense_type, amount, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(uid, expense_date, expense_type, numAmount, cleanDesc, now);

  return {
    id: Number(result.lastInsertRowid),
    user_id: uid,
    expense_date,
    expense_type,
    amount: numAmount,
    description: cleanDesc,
    created_at: now,
  };
}

/**
 * Get single expense by ID scoped to authenticated owner
 */
export function getExpenseById(id, userId = 1) {
  const uid = Number(userId || 1);
  const expense = db
    .prepare('SELECT id, user_id, expense_date, expense_type, amount, description, created_at FROM expenses WHERE id = ? AND user_id = ?')
    .get(id, uid);

  if (!expense) return null;
  return {
    ...expense,
    amount: Number(expense.amount),
  };
}

/**
 * Update an existing expense scoped to authenticated owner
 */
export function updateExpense(id, { expense_date, expense_type, amount, description = '', userId }, secondArg = 1) {
  const uid = Number(userId || secondArg || 1);
  const existing = getExpenseById(id, uid);
  if (!existing) {
    const err = new Error(`Expense with ID ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  validateExpenseInput({ expense_date, expense_type, amount });

  const numAmount = Number(amount);
  const cleanDesc = description ? String(description).trim() : null;

  db.prepare(
    `UPDATE expenses
     SET expense_date = ?, expense_type = ?, amount = ?, description = ?
     WHERE id = ? AND user_id = ?`
  ).run(expense_date, expense_type, numAmount, cleanDesc, id, uid);

  return {
    id: Number(id),
    user_id: uid,
    expense_date,
    expense_type,
    amount: numAmount,
    description: cleanDesc,
  };
}

/**
 * Delete an expense scoped to authenticated owner
 */
export function deleteExpense(id, userId = 1) {
  const uid = Number(userId || 1);
  const existing = getExpenseById(id, uid);
  if (!existing) {
    const err = new Error(`Expense with ID ${id} not found.`);
    err.statusCode = 404;
    throw err;
  }

  db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, uid);
  return {
    success: true,
    deleted_id: Number(id),
    message: 'Expense deleted successfully',
  };
}

/**
 * Read expenses list with filtering scoped to authenticated owner
 */
export function getExpenses({ month, category, startDate, endDate, limit = 100, offset = 0 } = {}, userId = 1) {
  const uid = Number(userId || 1);
  let query = 'SELECT id, user_id, expense_date, expense_type, amount, description, created_at FROM expenses WHERE user_id = ?';
  const params = [uid];

  if (category) {
    query += ' AND expense_type = ?';
    params.push(category);
  }

  if (month) {
    query += ' AND expense_date LIKE ?';
    params.push(`${month}%`);
  } else {
    if (startDate) {
      query += ' AND expense_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND expense_date <= ?';
      params.push(endDate);
    }
  }

  query += ' ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
}

/**
 * Calculate total expenses for Today scoped to authenticated owner
 */
export function getTodayExpensesTotal(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);
  const result = db
    .prepare('SELECT COALESCE(SUM(amount), 0) AS today_expenses FROM expenses WHERE expense_date = ? AND user_id = ?')
    .get(targetDate, uid);

  const countResult = db
    .prepare('SELECT COUNT(*) AS total_count FROM expenses WHERE expense_date = ? AND user_id = ?')
    .get(targetDate, uid);

  return {
    date: targetDate,
    today_expenses: Number(result.today_expenses),
    entries_count: Number(countResult.total_count),
  };
}

/**
 * Calculate monthly total expenses and breakdown by category scoped to authenticated owner
 */
export function getMonthlyTotalExpenses(yearMonth, userId = 1) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Valid month in YYYY-MM format is required.');
  }

  const uid = Number(userId || 1);
  const totalResult = db
    .prepare('SELECT COALESCE(SUM(amount), 0) AS monthly_expenses FROM expenses WHERE expense_date LIKE ? AND user_id = ?')
    .get(`${yearMonth}%`, uid);

  const breakdownRows = db
    .prepare(`
      SELECT expense_type, COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS count
      FROM expenses
      WHERE expense_date LIKE ? AND user_id = ?
      GROUP BY expense_type
    `)
    .all(`${yearMonth}%`, uid);

  const categoryBreakdown = {};
  APPROVED_EXPENSE_CATEGORIES.forEach((cat) => {
    categoryBreakdown[cat] = 0;
  });
  breakdownRows.forEach((r) => {
    categoryBreakdown[r.expense_type] = Number(r.total_amount);
  });

  return {
    month: yearMonth,
    monthly_expenses: Number(totalResult.monthly_expenses),
    breakdown: categoryBreakdown,
  };
}

export const getMonthlyExpensesByCategory = getMonthlyTotalExpenses;
