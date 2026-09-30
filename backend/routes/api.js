import express from 'express';
import { getDatabaseStatus } from '../db/database.js';

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
import * as supabaseService from '../services/supabaseService.js';

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
router.get('/health', (req, res) => {
  try {
    const dbStatus = getDatabaseStatus();
    res.json({
      success: true,
      app: 'Business Management & Accountant Management App',
      status: 'Production Ready (V1.0)',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// Sign Up
router.post('/auth/signup', (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    const result = authService.createOwnerAccount({ username, password, confirmPassword });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: result.token,
      user: result.user,
      business_profile: result.profile || null,
      needs_profile: true,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Login
router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = authService.loginOwner({ username, password, clientIp });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token: result.token,
      user: result.user,
      business_profile: result.profile || null,
      needs_profile: result.needs_profile,
    });
  } catch (error) {
    const status = error.statusCode || 401;
    handleError(res, error, status);
  }
});

// Logout
router.post('/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      authService.logoutOwner(token);
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
router.get('/auth/me', requireAuth, (req, res) => {
  try {
    const profile = authService.getBusinessProfile(req.userId);
    res.json({
      success: true,
      user: req.user,
      business_profile: profile,
    });
  } catch (error) {
    handleError(res, error, 401);
  }
});

// -------------------------------------------------------------
// BUSINESS PROFILE ENDPOINTS
// -------------------------------------------------------------

// Get Business Profile
router.get('/business-profile', authenticateOwner, (req, res) => {
  try {
    const profile = authService.getBusinessProfile(req.userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Create or Update Business Profile
const handleBusinessProfileSave = (req, res) => {
  try {
    const { business_name, business_address, business_nickname } = req.body;
    const profile = authService.upsertBusinessProfile({
      userId: req.userId,
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
// 1. DAILY SALES ENDPOINTS
// -------------------------------------------------------------

// Record or update daily sales
router.post('/sales', (req, res) => {
  try {
    const { entry_date, total_sales_amount } = req.body;
    const result = salesService.recordDailySales(entry_date, total_sales_amount, req.userId);

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'UPSERT',
      entityType: 'sales',
      entityId: result.id,
      payload: result,
      date: entry_date,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Sales hook error:', err.message));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve today's sales
router.get('/sales/today', (req, res) => {
  try {
    const { date } = req.query;
    const result = salesService.getTodaySales(date, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve monthly total sales
router.get('/sales/monthly', (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const result = salesService.getMonthlyTotalSales(targetMonth, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve date-wise sales history
router.get('/sales', (req, res) => {
  try {
    const { month, startDate, endDate, limit, offset } = req.query;
    const history = salesService.getSalesHistory({
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
router.get('/sales/:date', (req, res) => {
  try {
    const { date } = req.params;
    const record = salesService.getSalesByDate(date, req.userId);
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
// 2. DAILY EXPENSES ENDPOINTS
// -------------------------------------------------------------

// Add expense
router.post('/expenses', (req, res) => {
  try {
    const { expense_date, expense_type, amount, description } = req.body;
    const result = expenseService.addExpense({
      expense_date,
      expense_type,
      amount,
      description,
      userId: req.userId,
    });

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'CREATE',
      entityType: 'expenses',
      entityId: result.id,
      payload: result,
      date: expense_date,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Expenses hook error:', err.message));

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Get expenses list with filters (category, month, date range)
router.get('/expenses', (req, res) => {
  try {
    const { month, category, startDate, endDate, limit, offset } = req.query;
    const items = expenseService.getExpenses({
      month,
      category,
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
router.get('/expenses/today', (req, res) => {
  try {
    const { date } = req.query;
    const result = expenseService.getTodayExpensesTotal(date, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Monthly total expenses and breakdown
router.get('/expenses/monthly', (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const result = expenseService.getMonthlyTotalExpenses(targetMonth, req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Get single expense
router.get('/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const expense = expenseService.getExpenseById(id, req.userId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: `Expense with ID ${id} not found.`,
      });
    }
    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Update expense
router.put('/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expense_date, expense_type, amount, description } = req.body;
    const updated = expenseService.updateExpense(id, {
      expense_date,
      expense_type,
      amount,
      description,
      userId: req.userId,
    });

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'UPDATE',
      entityType: 'expenses',
      entityId: id,
      payload: updated,
      date: updated.expense_date,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Expenses hook error:', err.message));

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// Delete expense
router.delete('/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = expenseService.deleteExpense(id, req.userId);

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'DELETE',
      entityType: 'expenses',
      entityId: id,
      payload: { id },
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Expenses hook error:', err.message));

    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// -------------------------------------------------------------
// 3. STOCK MANAGEMENT & VARIETIES ENDPOINTS
// -------------------------------------------------------------

// List all varieties with current stock
router.get('/stock/varieties', (req, res) => {
  try {
    const varieties = stockService.getAllVarieties(req.userId);
    res.json({
      success: true,
      count: varieties.length,
      data: varieties,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Add product variety
router.post('/stock/varieties', (req, res) => {
  try {
    const { name } = req.body;
    const result = stockService.addProductVariety(name, req.userId);

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'CREATE',
      entityType: 'stock_variety',
      entityId: result.id,
      payload: result,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Stock Variety hook error:', err.message));

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Get single variety by ID
router.get('/stock/varieties/:id', (req, res) => {
  try {
    const { id } = req.params;
    const variety = stockService.getVarietyById(id, req.userId);
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

// Record Stock Movement (IN or OUT)
router.post('/stock/movement', (req, res) => {
  try {
    const { product_id, movement_type, quantity, entry_date, notes } = req.body;
    const result = stockService.recordStockMovement({
      product_id,
      movement_type,
      quantity,
      entry_date,
      notes,
      userId: req.userId,
    });

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'CREATE',
      entityType: 'stock_movement',
      entityId: result.id,
      payload: result,
      date: entry_date,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Stock Movement hook error:', err.message));

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Retrieve Stock Movement History
router.get('/stock/history', (req, res) => {
  try {
    const { product_id, startDate, endDate, limit, offset } = req.query;
    const history = stockService.getStockHistory({
      product_id: product_id ? Number(product_id) : undefined,
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
router.get('/stock/summary', (req, res) => {
  try {
    const summary = stockService.getTotalStockSummary(req.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// -------------------------------------------------------------
// 4. LENDER MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// Add lender
router.post('/lenders', (req, res) => {
  try {
    const { name, mobile, place, amount_given, amount_paid, loan_date, notes } = req.body;
    const result = lenderService.addLender({
      name,
      mobile,
      place,
      amount_given,
      amount_paid,
      loan_date,
      notes,
      userId: req.userId,
    });

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'CREATE',
      entityType: 'lender',
      entityId: result.id,
      payload: result,
      date: loan_date,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Lender hook error:', err.message));

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// View all lenders
router.get('/lenders', (req, res) => {
  try {
    const lenders = lenderService.getAllLenders(req.userId);
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
router.get('/lenders/summary', (req, res) => {
  try {
    const summary = lenderService.getTotalLenderSummary(req.userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Get single lender
router.get('/lenders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const lender = lenderService.getLenderById(id, req.userId);
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
router.put('/lenders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = lenderService.updateLender(id, { ...req.body, userId: req.userId });

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'UPDATE',
      entityType: 'lender',
      entityId: id,
      payload: updated,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Lender hook error:', err.message));

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// Record lender payment (supports both PATCH and POST)
const handleLenderPayment = (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount } = req.body;
    const result = lenderService.recordLenderPayment(id, payment_amount, req.userId);

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'PAYMENT',
      entityType: 'lender',
      entityId: id,
      payload: result,
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Lender hook error:', err.message));

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

// Delete lender
router.delete('/lenders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = lenderService.deleteLender(id, req.userId);

    // Automatic cloud backup sync hook
    cloudBackupService.triggerCloudSync({
      mutationType: 'DELETE',
      entityType: 'lender',
      entityId: id,
      payload: { id },
      userId: req.userId,
    }).catch((err) => console.error('[CloudSync] Lender hook error:', err.message));

    res.json(result);
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    handleError(res, error, status);
  }
});

// -------------------------------------------------------------
// 5. AUTOMATIC CALCULATIONS & DASHBOARD ENDPOINTS
// -------------------------------------------------------------

// Today metrics: Today's Sales, Today's Expenses, Today's Net Amount
router.get('/calculations/today', (req, res) => {
  try {
    const { date } = req.query;
    const metrics = calculationService.calculateTodayMetrics(date, req.userId);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Monthly metrics: Total Sales, Total Expenses, Monthly Turnover, Net Balance
router.get('/calculations/monthly', (req, res) => {
  try {
    const { month } = req.query;
    const metrics = calculationService.calculateMonthlyMetrics(month, req.userId);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Master Dashboard KPI Summary (All 9 metrics)
router.get('/calculations/dashboard', (req, res) => {
  try {
    const { date, month } = req.query;
    const summary = calculationService.getDashboardSummary({ date, month, userId: req.userId });
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
router.get('/reports/monthly', (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const report = reportService.generateMonthlyReportData(targetMonth, req.userId);
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// Download monthly report file (CSV or JSON)
router.get('/reports/monthly/download', (req, res) => {
  try {
    const { month, format } = req.query;
    const targetMonth = month || calculationService.getCurrentMonthString();
    const reportData = reportService.generateMonthlyReportData(targetMonth, req.userId);
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
// 7. AUTOMATIC CLOUD DATABASE BACKUP
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
router.post('/cloud-backup/sync-now', async (req, res) => {
  try {
    const result = await cloudBackupService.retryPendingSyncs(req.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

// Safe restore of monthly backup
router.post('/cloud-backup/restore', (req, res) => {
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

// -------------------------------------------------------------
// 8. AUTHORITATIVE CLOUD PROVIDER & MULTI-DEVICE SYNC
// -------------------------------------------------------------

// Get overall cloud provider status, connection state, and sync mode
router.get('/cloud-provider/status', async (req, res) => {
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
router.post('/cloud-provider/sync-pending', async (req, res) => {
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

// Reconcile cloud data to local SQLite cache (Device Loss / New Device flow)
router.post('/cloud-provider/reconcile', async (req, res) => {
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

// Compute financial parity audit between SQLite and Supabase
router.get('/cloud-provider/parity-audit', async (req, res) => {
  try {
    if (!supabaseService.isSupabaseConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Cloud provider not configured. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run parity audit.',
      });
    }

    const cloudMetrics = await supabaseService.getCloudParityMetrics(req.userId);
    res.json({
      success: true,
      data: cloudMetrics,
    });
  } catch (error) {
    handleError(res, error, 500);
  }
});

export default router;
