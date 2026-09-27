import { Router } from 'express';
import {
  createExpenseHandler,
  getExpensesHandler,
  deleteExpenseHandler
} from '../controllers/expensesController';
import { getAnalyticsHandler } from '../controllers/analyticsController';
import {
  getProjectsHandler,
  getProjectHandler,
  createProjectHandler
} from '../controllers/projectsController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Construction Expense & Profit Tracker API'
  });
});

// Projects endpoints
router.get('/projects', getProjectsHandler);
router.post('/projects', createProjectHandler);
router.get('/projects/:id', getProjectHandler);

// Expenses endpoints
router.post('/expenses', createExpenseHandler);
router.get('/expenses', getExpensesHandler);
router.delete('/expenses/:id', deleteExpenseHandler);

// Analytics endpoints
router.get('/projects/:projectId/analytics', getAnalyticsHandler);
router.get('/analytics', getAnalyticsHandler);

export default router;
