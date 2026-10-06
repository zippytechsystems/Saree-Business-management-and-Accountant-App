import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { getDatabaseStatus } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Services
import * as salesService from '../services/salesService.js';
import * as expenseService from '../services/expenseService.js';
import * as stockService from '../services/stockService.js';
import * as lenderService from '../services/lenderService.js';
import * as calculationService from '../services/calculationService.js';
import * as reportService from '../services/reportService.js';
import * as cloudBackupService from '../services/cloudBackupService.js';
import * as authService from '../services/authService.js';
import * as authoritativeDataService from '../services/authoritativeDataService.js';
import * as mysqlService from '../services/mysqlService.js';

// Middleware
import { authenticateOwner, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper for consistent error response
function handleError(res, error, defaultStatusCode = 400) {
  const statusCode = error.statusCode || defaultStatusCode;
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An unexpected error occurred.',
  });
}

// -------------------------------------------------------------
// SYSTEM & HEALTH
// -------------------------------------------------------------
router.get('/health', async (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    const isMysql = mysqlService.isMysqlConfigured();
    let mysqlStatus = null;
    if (isMysql) {
      mysqlStatus = await mysqlService.testMysqlConnection();
    }

    res.json({
      success: true,
      app: 'Business Management & Accountant Management App',
      hosting: 'Hostinger Production Environment',
      status: 'Production Ready (V1.0)',
      database: {
        ...dbStatus,
        mode: isMysql && mysqlStatus?.connected ? 'hostinger_mysql' : 'hostinger_sqlite',
        engine: isMysql && mysqlStatus?.connected ? 'Hostinger MySQL (InnoDB)' : 'Hostinger Enterprise SQLite (WAL Mode)',
        mysql_configured: isMysql,
        mysql_connected: Boolean(mysqlStatus?.connected),
        mysql_database: isMysql ? mysqlStatus?.database : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Sign Up
router.post('/auth/signup', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    const result = await authoritativeDataService.signupUserAuthoritative({ username, password, confirmPassword });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: result.token,
      user: result.user,
      business_profile: result.business_profile || null,
      needs_profile: result.needs_profile,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await authoritativeDataService.loginUserAuthoritative({ username, password, clientIp });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: result.token,
      user: result.user,
      business_profile: result.profile || {
        business_name: `${result.user?.username || 'Owner'} Business`,
        business_nickname: result.user?.username || 'Owner',
        business_address: 'Main Store',
      },
      needs_profile: false,
    });
  } catch (error) {
    const status = error.statusCode || 401;
    handleError(res, error, status);
  }
});

// Logout
router.post('/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      await authoritativeDataService.logoutUserAuthoritative(token);
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Get Current Authenticated Owner Profile
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    let profile = await authoritativeDataService.getBusinessProfileAuthoritative(req.userId);
    if (!profile) {
      profile = {
        user_id: req.userId,
        business_name: `${req.user?.username || 'Owner'} Business`,
        business_nickname: req.user?.username || 'Owner',
        business_address: 'Main Store',
      };
    }
    res.json({
      success: true,
      user: req.user,
      business_profile: profile,
      needs_profile: false,
    });
  } catch (error) {
    handleError(res, error, 401);
  }
});

// -------------------------------------------------------------
// BUSINESS PROFILE ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Get Business Profile
router.get('/business-profile', authenticateOwner, async (req, res) => {
  try {
    const profile = await authoritativeDataService.getBusinessProfileAuthoritative(req.userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Create or Update Business Profile
const handleBusinessProfileSave = async (req, res) => {
  try {
    const { business_name, business_address, business_nickname } = req.body;
    const profile = await authoritativeDataService.upsertBusinessProfileAuthoritative(req.userId, {
      business_name,
      business_address,
      business_nickname,
    });
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
};

router.post('/business-profile', authenticateOwner, handleBusinessProfileSave);
router.put('/business-profile', authenticateOwner, handleBusinessProfileSave);

// -------------------------------------------------------------
// AUTHENTICATE ALL SUBSEQUENT BUSINESS ROUTES
// Default to Owner 1 if no Authorization header is passed (backward compatible with tests)
// -------------------------------------------------------------
router.use(authenticateOwner);

// -------------------------------------------------------------
// 1. DAILY SALES ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Record or update daily sales
router.post('/sales', async (req, res) => {
  try {
    const { entry_date, total_sales_amount } = req.body;
    const result = await authoritativeDataService.recordSaleAuthoritative(entry_date, total_sales_amount, req.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve today's sales
router.get('/sales/today', async (req, res) => {
  try {
    const { date } = req.query;
    const result = await authoritativeDataService.getTodaySalesAuthoritative(date, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve monthly total sales
router.get('/sales/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const result = await authoritativeDataService.getMonthlyTotalSalesAuthoritative(targetMonth, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve date-wise sales history
router.get('/sales', async (req, res) => {
  try {
    const { month, startDate, endDate, limit, offset } = req.query;
    const history = await authoritativeDataService.getSalesAuthoritative({
      month,
      startDate,
      endDate,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
      userId: req.userId,
    });
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve sales for a specific date
router.get('/sales/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const record = await authoritativeDataService.getSalesByDateAuthoritative(date, req.userId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: `No sales record found for date ${date}.`,
      });
    }
    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// -------------------------------------------------------------
// 2. DAILY EXPENSES ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Add expense
router.post('/expenses', async (req, res) => {
  try {
    const { expense_date, expense_type, amount, description } = req.body;
    const result = await authoritativeDataService.recordExpenseAuthoritative(
      {
        expense_date,
        expense_type,
        amount,
        description,
      },
      req.userId
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Get expenses list with filters (category, month, date range)
router.get('/expenses', async (req, res) => {
  try {
    const { month, category, startDate, endDate, limit, offset } = req.query;
    const items = await authoritativeDataService.getExpensesAuthoritative({
      month,
      expenseType: category,
      startDate,
      endDate,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
      userId: req.userId,
    });
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Today's total expenses
router.get('/expenses/today', async (req, res) => {
  try {
    const { date } = req.query;
    const result = await authoritativeDataService.getTodayExpensesAuthoritative(date, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Monthly total expenses and breakdown
router.get('/expenses/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const result = await authoritativeDataService.getMonthlyExpensesByCategoryAuthoritative(targetMonth, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Update expense
router.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { expense_date, expense_type, amount, description } = req.body;
    const updated = await authoritativeDataService.updateExpenseAuthoritative(
      id,
      {
        expense_date,
        expense_type,
        amount,
        description,
      },
      req.userId
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Delete expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authoritativeDataService.deleteExpenseAuthoritative(id, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// -------------------------------------------------------------
// 3. STOCK & VARIETIES MANAGEMENT ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Add product variety
router.post('/stock/varieties', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await authoritativeDataService.addProductVarietyAuthoritative(name, req.userId);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// View all product varieties
router.get('/stock/varieties', async (req, res) => {
  try {
    const varieties = await authoritativeDataService.getProductVarietiesAuthoritative(req.userId);
    res.json({
      success: true,
      count: varieties.length,
      data: varieties,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// View single product variety by ID
router.get('/stock/varieties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const variety = await authoritativeDataService.getProductVarietyByIdAuthoritative(id, req.userId);
    if (!variety) {
      return res.status(404).json({
        success: false,
        error: `Product variety with ID ${id} not found.`,
      });
    }
    res.json({
      success: true,
      data: variety,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Record Stock Movement (IN / OUT)
router.post(['/stock/entries', '/stock/movement'], async (req, res) => {
  try {
    const { product_id, movement_type, quantity, entry_date, notes } = req.body;
    const result = await authoritativeDataService.recordStockMovementAuthoritative(
      {
        product_id,
        movement_type,
        quantity,
        entry_date,
        notes,
      },
      req.userId
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve Stock Movement History
router.get('/stock/history', async (req, res) => {
  try {
    const { product_id, startDate, endDate, limit, offset } = req.query;
    const history = await authoritativeDataService.getStockEntriesAuthoritative({
      productId: product_id ? Number(product_id) : undefined,
      startDate,
      endDate,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
      userId: req.userId,
    });
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Overall Stock Summary
router.get('/stock/summary', async (req, res) => {
  try {
    const summary = await authoritativeDataService.getStockSummaryAuthoritative(req.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// 4. LENDER MANAGEMENT ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Add lender
router.post('/lenders', async (req, res) => {
  try {
    const { name, mobile, place, amount_given, amount_paid, loan_date, notes } = req.body;
    const result = await authoritativeDataService.addLenderAuthoritative(
      {
        name,
        mobile,
        place,
        amount_given,
        amount_paid,
        loan_date,
        notes,
      },
      req.userId
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// View all lenders
router.get('/lenders', async (req, res) => {
  try {
    const lenders = await authoritativeDataService.getLendersAuthoritative(req.userId);
    res.json({
      success: true,
      count: lenders.length,
      data: lenders,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Total lender dues summary
router.get('/lenders/summary', async (req, res) => {
  try {
    const lenders = await authoritativeDataService.getLendersAuthoritative(req.userId);
    const totalGiven = lenders.reduce((acc, l) => acc + Number(l.amount_given || 0), 0);
    const totalPaid = lenders.reduce((acc, l) => acc + Number(l.amount_paid || 0), 0);
    const totalBalance = totalGiven - totalPaid;
    const activeCount = lenders.filter((l) => Number(l.amount_given || 0) - Number(l.amount_paid || 0) > 0).length;
    const settledCount = lenders.length - activeCount;

    res.json({
      success: true,
      data: {
        total_lenders: lenders.length,
        total_amount_given: totalGiven,
        total_amount_paid: totalPaid,
        total_balance_due: totalBalance,
        active_loans_count: activeCount,
        settled_loans_count: settledCount,
      },
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Get single lender
router.get('/lenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lenders = await authoritativeDataService.getLendersAuthoritative(req.userId);
    const lender = lenders.find((l) => Number(l.id) === Number(id));
    if (!lender) {
      return res.status(404).json({
        success: false,
        error: `Lender with ID ${id} not found.`,
      });
    }
    res.json({
      success: true,
      data: lender,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Update lender
router.put('/lenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = lenderService.updateLender(id, { ...req.body, userId: req.userId });

    // Sync to MySQL if configured
    if (mysqlService.isMysqlConfigured()) {
      mysqlService.createLender(req.userId, updated).catch(() => {});
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// Record lender repayment
const handleLenderPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount, notes } = req.body;
    const result = await authoritativeDataService.recordLenderRepaymentAuthoritative(
      id,
      payment_amount,
      notes,
      req.userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
};
router.patch('/lenders/:id/pay', handleLenderPayment);
router.post('/lenders/:id/pay', handleLenderPayment);
router.post('/lenders/:id/repay', handleLenderPayment);

// Delete lender
router.delete('/lenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = lenderService.deleteLender(id, req.userId);
    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// -------------------------------------------------------------
// 5. AUTOMATIC CALCULATIONS & DASHBOARD ENDPOINTS (Authoritative Cloud-First)
// -------------------------------------------------------------

// Today metrics: Today's Sales, Today's Expenses, Today's Net Amount
router.get('/calculations/today', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || salesService.getTodayDateString();
    const todaySales = await authoritativeDataService.getTodaySalesAuthoritative(targetDate, req.userId);
    const todayExpenses = await authoritativeDataService.getTodayExpensesAuthoritative(targetDate, req.userId);
    const net = todaySales.total_sales_amount - todayExpenses.today_expenses;

    res.json({
      success: true,
      data: {
        date: targetDate,
        today_sales: todaySales.total_sales_amount,
        today_expenses: todayExpenses.today_expenses,
        today_net_amount: net,
        is_surplus: net >= 0,
      },
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Monthly metrics: Total Sales, Total Expenses, Monthly Turnover, Net Balance
router.get('/calculations/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const salesData = await authoritativeDataService.getMonthlyTotalSalesAuthoritative(targetMonth, req.userId);
    const expensesData = await authoritativeDataService.getMonthlyExpensesByCategoryAuthoritative(targetMonth, req.userId);

    const mSales = salesData.monthly_sales;
    const mExp = expensesData.monthly_expenses;
    const net = mSales - mExp;

    res.json({
      success: true,
      data: {
        month: targetMonth,
        monthly_sales: mSales,
        monthly_expenses: mExp,
        monthly_turnover: mSales,
        monthly_net_balance: net,
        is_surplus: net >= 0,
        expense_breakdown: expensesData.breakdown,
      },
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Master Dashboard KPI Summary (All metrics)
router.get('/calculations/dashboard', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const summary = await authoritativeDataService.getMonthlyFinancialSummaryAuthoritative(targetMonth, req.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

router.get('/calculations/summary', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const summary = await authoritativeDataService.getMonthlyFinancialSummaryAuthoritative(targetMonth, req.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// 6. MONTHLY DATA DOWNLOAD & REPORTS
// -------------------------------------------------------------

// Get monthly report data (JSON)
router.get('/reports/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const report = await authoritativeDataService.generateMonthlyReportDataAuthoritative(targetMonth, req.userId);
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Download monthly report file (CSV or JSON)
router.get('/reports/monthly/download', async (req, res) => {
  try {
    const { month, format } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const reportData = await authoritativeDataService.generateMonthlyReportDataAuthoritative(targetMonth, req.userId);
    const fileFormat = (format || 'csv').toLowerCase();

    if (fileFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="monthly_business_report_${targetMonth}.json"`
      );
      return res.send(JSON.stringify(reportData, null, 2));
    }

    const csvContent = reportService.formatReportAsCsv(reportData);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="monthly_business_report_${targetMonth}.csv"`
    );
    return res.send(csvContent);
  } catch (error) {
    handleError(res, error, 400);
  }
});

// -------------------------------------------------------------
// 7. CLOUD DATABASE BACKUP & RESTORE
// -------------------------------------------------------------

// Get current cloud backup status & configuration state
router.get('/cloud-backup/status', (req, res) => {
  try {
    const status = cloudBackupService.getBackupStatus(req.userId);
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Get monthly backup history
router.get('/cloud-backup/history', (req, res) => {
  try {
    const history = cloudBackupService.getBackupHistory(req.userId);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Manual trigger to flush/retry pending or failed cloud syncs
router.post('/cloud-backup/sync-now', requireAuth, async (req, res) => {
  try {
    const result = await authoritativeDataService.flushOfflineQueue(req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Safe restore of monthly backup
router.post('/cloud-backup/restore', requireAuth, (req, res) => {
  try {
    const { month } = req.body;
    const result = cloudBackupService.restoreMonthlyBackup(month);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Download full local SQLite database (for Hostinger backups)
router.get('/cloud-backup/download', requireAuth, (req, res) => {
  try {
    const dbPath = path.resolve(__dirname, '../../data/app.db');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, error: 'Database file not found.' });
    }
    const today = new Date().toISOString().substring(0, 10);
    res.download(dbPath, `hostinger_business_backup_${today}.db`);
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Export Clean, Human-Readable Business Data (Opens without errors in any app/phone/browser)
router.get('/cloud-backup/export', requireAuth, async (req, res) => {
  try {
    const uid = Number(req.userId || 1);
    let profile = null;
    try {
      profile = await authoritativeDataService.getBusinessProfileAuthoritative(uid);
    } catch (e) {
      profile = { business_name: 'Business Records' };
    }

    const sales = salesService.getSalesHistory({ limit: 10000 }, uid);
    const expenses = expenseService.getExpenses({ limit: 10000 }, uid);
    const varieties = stockService.getAllVarieties(uid);
    const stockHistory = stockService.getStockHistory({ limit: 10000 }, uid);
    const lenders = lenderService.getAllLenders(uid);
    const calculations = calculationService.getDashboardSummary({ userId: uid });

    const exportData = {
      app: 'Saree Business Management & Accountant App',
      version: '1.0.0',
      backup_type: 'clean_business_records',
      exported_at: new Date().toISOString(),
      business_profile: profile || { business_name: 'Business Records' },
      financial_summary: calculations,
      sales: sales || [],
      expenses: expenses || [],
      inventory_varieties: varieties || [],
      stock_movements: stockHistory || [],
      lenders_book: lenders || [],
    };

    const today = new Date().toISOString().substring(0, 10);
    const filename = `business_backup_${today}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// 8. AUTHORITATIVE CLOUD PROVIDER & MULTI-DEVICE SYNC
// -------------------------------------------------------------

// Get overall cloud provider status, connection state, and sync mode
router.get('/cloud-provider/status', requireAuth, async (req, res) => {
  try {
    const status = await authoritativeDataService.getSyncStatus(req.userId);
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Flush offline mutation queue with idempotency protection
router.post('/cloud-provider/sync-pending', requireAuth, async (req, res) => {
  try {
    const result = await authoritativeDataService.flushOfflineQueue(req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Reconcile cloud data to local SQLite cache
router.post('/cloud-provider/reconcile', requireAuth, async (req, res) => {
  try {
    const result = await authoritativeDataService.reconcileCloudToLocal(req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Compute financial parity audit for Hostinger MySQL
router.get('/cloud-provider/parity-audit', requireAuth, async (req, res) => {
  try {
    if (!mysqlService.isMysqlConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Hostinger MySQL database not configured. Configure DB_HOST, DB_NAME, DB_USER in environment.',
      });
    }

    const parityMetrics = await mysqlService.getMysqlParityMetrics(req.userId);
    res.json({
      success: true,
      data: parityMetrics,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

export default router;
