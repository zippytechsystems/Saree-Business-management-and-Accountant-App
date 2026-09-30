import db from '../db/database.js';

// Helper to get local date in YYYY-MM-DD format
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Validate YYYY-MM-DD format
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

/**
 * Record or update daily sales for a specific date scoped to authenticated owner
 * Strictly ONE record per date per user.
 */
export function recordDailySales(entryDate, amount, userId = 1) {
  if (!entryDate || !isValidDateString(entryDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Total sales amount must be a non-negative number.');
  }

  const uid = Number(userId || 1);

  // Check if entry exists for this date and user
  const existing = db
    .prepare('SELECT id, entry_date, total_sales_amount FROM daily_sales WHERE entry_date = ? AND user_id = ?')
    .get(entryDate, uid);

  const now = new Date().toISOString();

  if (existing) {
    // Update existing record
    db.prepare(
      'UPDATE daily_sales SET total_sales_amount = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(numericAmount, now, existing.id, uid);

    return {
      id: existing.id,
      user_id: uid,
      entry_date: entryDate,
      total_sales_amount: numericAmount,
      is_updated: true,
      message: `Updated sales record for ${entryDate}`,
    };
  } else {
    // Insert new record
    const result = db.prepare(
      'INSERT INTO daily_sales (user_id, entry_date, total_sales_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(uid, entryDate, numericAmount, now, now);

    return {
      id: Number(result.lastInsertRowid),
      user_id: uid,
      entry_date: entryDate,
      total_sales_amount: numericAmount,
      is_updated: false,
      message: `Created sales record for ${entryDate}`,
    };
  }
}

/**
 * Retrieve sales for today's date scoped to authenticated owner
 */
export function getTodaySales(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);
  const record = db
    .prepare('SELECT id, entry_date, total_sales_amount FROM daily_sales WHERE entry_date = ? AND user_id = ?')
    .get(targetDate, uid);

  return {
    date: targetDate,
    total_sales_amount: record ? Number(record.total_sales_amount) : 0,
    has_entry: Boolean(record),
  };
}

/**
 * Retrieve sales record for a specific date scoped to authenticated owner
 */
export function getSalesByDate(entryDate, userId = 1) {
  if (!entryDate || !isValidDateString(entryDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const uid = Number(userId || 1);
  const record = db
    .prepare('SELECT id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales WHERE entry_date = ? AND user_id = ?')
    .get(entryDate, uid);

  if (!record) return null;
  return {
    ...record,
    total_sales_amount: Number(record.total_sales_amount),
  };
}

/**
 * Retrieve date-wise sales history scoped to authenticated owner
 */
export function getSalesHistory({ month, startDate, endDate, limit = 100, offset = 0 } = {}, userId = 1) {
  const uid = Number(userId || 1);
  let query = 'SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales WHERE user_id = ?';
  const params = [uid];

  if (month) {
    query += ' AND entry_date LIKE ?';
    params.push(`${month}%`);
  } else {
    if (startDate) {
      query += ' AND entry_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND entry_date <= ?';
      params.push(endDate);
    }
  }

  query += ' ORDER BY entry_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map((r) => ({
    ...r,
    total_sales_amount: Number(r.total_sales_amount),
  }));
}

/**
 * Calculate total sales for a given month (YYYY-MM) scoped to authenticated owner
 */
export function getMonthlyTotalSales(yearMonth, userId = 1) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Valid month in YYYY-MM format is required.');
  }

  const uid = Number(userId || 1);
  const result = db
    .prepare("SELECT COALESCE(SUM(total_sales_amount), 0) AS monthly_sales FROM daily_sales WHERE entry_date LIKE ? AND user_id = ?")
    .get(`${yearMonth}%`, uid);

  const countResult = db
    .prepare("SELECT COUNT(*) AS total_entries FROM daily_sales WHERE entry_date LIKE ? AND user_id = ?")
    .get(`${yearMonth}%`, uid);

  return {
    month: yearMonth,
    monthly_sales: Number(result.monthly_sales),
    entries_count: Number(countResult.total_entries),
  };
}
