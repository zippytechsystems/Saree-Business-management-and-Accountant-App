import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Project, Expense, AnalyticsSummary, ExpenseCategory, ExpenseCategories } from '../types';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

export let pgPool: Pool | null = null;
export let isUsingPg = false;

// In-Memory store fallback for effortless local testing / development
const DEFAULT_PROJECT_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

const mockProjects: Project[] = [
  {
    id: DEFAULT_PROJECT_ID,
    project_name: 'Oakridge Villa Construction',
    total_budget: 125000.00,
    start_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    category: 'Cement',
    amount: 4200.00,
    remarks: '50 Bags Portland Cement (Foundation footing)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-002',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    category: 'Transport',
    amount: 650.00,
    remarks: 'Cement delivery flatbed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-003',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    category: 'Steel',
    amount: 8500.00,
    remarks: 'TMT Rebar 12mm & 16mm bundle for pillar cage',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-004',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    category: 'Sand',
    amount: 1800.00,
    remarks: '3 River sand dump trucks for base filling',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-005',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    category: 'Labor',
    amount: 2600.00,
    remarks: 'Pillar binding and shuttering crew weekly payout',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-006',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'Other',
    amount: 450.00,
    remarks: 'Water pump rental & PVC pipe fittings',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-007',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date().toISOString().split('T')[0],
    category: 'Cement',
    amount: 2100.00,
    remarks: '25 Bags Cement for column pouring',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-008',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date().toISOString().split('T')[0],
    category: 'Labor',
    amount: 1400.00,
    remarks: 'Daily wage for 7 masons & helpers',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'exp-009',
    project_id: DEFAULT_PROJECT_ID,
    date: new Date().toISOString().split('T')[0],
    category: 'Transport',
    amount: 250.00,
    remarks: 'Material shuttle and fuel charges',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function initDatabase(): Promise<void> {
  if (DATABASE_URL) {
    try {
      console.log('Connecting to PostgreSQL database...');
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || DATABASE_URL.includes('supabase.co') 
          ? { rejectUnauthorized: false } 
          : undefined
      });
      const client = await pgPool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      isUsingPg = true;
      console.log('Connected to PostgreSQL successfully at', res.rows[0].now);
    } catch (err: any) {
      console.warn('PostgreSQL connection failed:', err.message);
      console.log('Falling back to high-fidelity In-Memory Database store with seed data.');
      isUsingPg = false;
      pgPool = null;
    }
  } else {
    console.log('No DATABASE_URL provided. Initialized In-Memory Database store with preloaded construction project data.');
    isUsingPg = false;
  }
}

// ----------------------------------------------------------------------------
// DB Operations
// ----------------------------------------------------------------------------

export async function getAllProjects(): Promise<Project[]> {
  if (isUsingPg && pgPool) {
    const result = await pgPool.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows.map(r => ({ ...r, total_budget: Number(r.total_budget) }));
  }
  return [...mockProjects];
}

export async function getProject(id: string): Promise<Project | null> {
  if (isUsingPg && pgPool) {
    const result = await pgPool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { ...r, total_budget: Number(r.total_budget) };
  }
  const proj = mockProjects.find(p => p.id === id);
  return proj ? { ...proj } : null;
}

export async function createProjectRecord(data: {
  project_name: string;
  total_budget: number;
  start_date: string;
  currency?: string;
}): Promise<Project> {
  if (isUsingPg && pgPool) {
    const query = `
      INSERT INTO projects (project_name, total_budget, start_date, currency)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await pgPool.query(query, [
      data.project_name,
      data.total_budget,
      data.start_date,
      data.currency || 'USD'
    ]);
    const r = res.rows[0];
    return { ...r, total_budget: Number(r.total_budget) };
  }

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    project_name: data.project_name,
    total_budget: Number(data.total_budget),
    start_date: data.start_date,
    currency: data.currency || 'USD',
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockProjects.unshift(newProject);
  return newProject;
}

export async function createExpenseRecord(data: {
  project_id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  remarks: string;
}): Promise<Expense> {
  if (isUsingPg && pgPool) {
    const query = `
      INSERT INTO expenses (project_id, date, category, amount, remarks)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const res = await pgPool.query(query, [
      data.project_id,
      data.date,
      data.category,
      data.amount,
      data.remarks
    ]);
    const r = res.rows[0];
    return {
      ...r,
      amount: Number(r.amount),
      date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]
    };
  }

  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    project_id: data.project_id,
    date: data.date,
    category: data.category,
    amount: Number(data.amount),
    remarks: data.remarks || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockExpenses.unshift(newExpense);
  return newExpense;
}

export async function getExpensesList(filters: {
  project_id: string;
  date?: string;
  category?: string;
  search?: string;
}): Promise<Expense[]> {
  if (isUsingPg && pgPool) {
    const conditions: string[] = ['project_id = $1'];
    const values: any[] = [filters.project_id];

    if (filters.date) {
      values.push(filters.date);
      conditions.push(`date = $${values.length}`);
    }

    if (filters.category && ExpenseCategories.includes(filters.category as ExpenseCategory)) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`remarks ILIKE $${values.length}`);
    }

    const query = `
      SELECT * FROM expenses
      WHERE ${conditions.join(' AND ')}
      ORDER BY date DESC, created_at DESC
    `;
    const res = await pgPool.query(query, values);
    return res.rows.map(r => ({
      ...r,
      amount: Number(r.amount),
      date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]
    }));
  }

  let list = mockExpenses.filter(e => e.project_id === filters.project_id);

  if (filters.date) {
    list = list.filter(e => e.date === filters.date);
  }
  if (filters.category && ExpenseCategories.includes(filters.category as ExpenseCategory)) {
    list = list.filter(e => e.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(e => e.remarks.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  }

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteExpenseRecord(id: string): Promise<boolean> {
  if (isUsingPg && pgPool) {
    const res = await pgPool.query('DELETE FROM expenses WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
  const index = mockExpenses.findIndex(e => e.id === id);
  if (index !== -1) {
    mockExpenses.splice(index, 1);
    return true;
  }
  return false;
}

export async function getAnalyticsData(projectId: string, targetDate: string): Promise<AnalyticsSummary | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  // Selected date components
  const selectedDateObj = new Date(targetDate);
  const selectedYear = selectedDateObj.getFullYear();
  const selectedMonth = (selectedDateObj.getMonth() + 1).toString().padStart(2, '0');
  const monthPrefix = `${selectedYear}-${selectedMonth}`;

  if (isUsingPg && pgPool) {
    // 1. End of the day total for selected date
    const todayRes = await pgPool.query(`
      SELECT COALESCE(SUM(amount), 0) AS today_sum
      FROM expenses
      WHERE project_id = $1 AND date = $2
    `, [projectId, targetDate]);

    // 2. Monthly accumulated expenses for current month
    const monthlyRes = await pgPool.query(`
      SELECT COALESCE(SUM(amount), 0) AS monthly_sum
      FROM expenses
      WHERE project_id = $1 
        AND date >= date_trunc('month', $2::date)
        AND date < (date_trunc('month', $2::date) + INTERVAL '1 month')
    `, [projectId, targetDate]);

    // 3. Total accumulated expenses project-wide
    const totalRes = await pgPool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_sum, COUNT(id) as total_count
      FROM expenses
      WHERE project_id = $1
    `, [projectId]);

    // 4. Category breakdown
    const catRes = await pgPool.query(`
      SELECT category, COALESCE(SUM(amount), 0) AS cat_sum, COUNT(id) as cat_count
      FROM expenses
      WHERE project_id = $1
      GROUP BY category
      ORDER BY cat_sum DESC
    `, [projectId]);

    const todayExpense = Number(todayRes.rows[0].today_sum);
    const monthlyTotal = Number(monthlyRes.rows[0].monthly_sum);
    const totalAccumulatedExpenses = Number(totalRes.rows[0].total_sum);
    const totalBudget = Number(project.total_budget);

    const remainingBudget = totalBudget - totalAccumulatedExpenses;
    const estimatedProfit = remainingBudget;
    const profitMarginPercentage = totalBudget > 0 ? Number(((estimatedProfit / totalBudget) * 100).toFixed(2)) : 0;
    const budgetUtilizedPercentage = totalBudget > 0 ? Number(((totalAccumulatedExpenses / totalBudget) * 100).toFixed(2)) : 0;

    const categoryMap = new Map<string, { total: number; count: number }>();
    catRes.rows.forEach(r => {
      categoryMap.set(r.category, {
        total: Number(r.cat_sum),
        count: Number(r.cat_count)
      });
    });

    const categoryBreakdown = ExpenseCategories.map(cat => {
      const data = categoryMap.get(cat) || { total: 0, count: 0 };
      const percentage = totalAccumulatedExpenses > 0 
        ? Number(((data.total / totalAccumulatedExpenses) * 100).toFixed(1))
        : 0;
      return {
        category: cat,
        total: data.total,
        percentage,
        count: data.count
      };
    });

    return {
      project_id: project.id,
      project_name: project.project_name,
      selected_date: targetDate,
      selected_month: monthPrefix,
      total_budget: totalBudget,
      today_expense: todayExpense,
      monthly_total: monthlyTotal,
      total_accumulated_expenses: totalAccumulatedExpenses,
      remaining_budget: remainingBudget,
      estimated_profit: estimatedProfit,
      profit_margin_percentage: profitMarginPercentage,
      budget_utilized_percentage: budgetUtilizedPercentage,
      category_breakdown: categoryBreakdown,
      recent_expenses_count: Number(totalRes.rows[0].total_count)
    };
  }

  // In-Memory calculation
  const allProjectExpenses = mockExpenses.filter(e => e.project_id === projectId);
  
  // End of the day total
  const todayExpense = allProjectExpenses
    .filter(e => e.date === targetDate)
    .reduce((sum, e) => sum + e.amount, 0);

  // Monthly accumulated total
  const monthlyTotal = allProjectExpenses
    .filter(e => e.date.startsWith(monthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  // Total project-wide accumulated expenses
  const totalAccumulatedExpenses = allProjectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = project.total_budget;
  const remainingBudget = totalBudget - totalAccumulatedExpenses;
  const estimatedProfit = remainingBudget;
  const profitMarginPercentage = totalBudget > 0 ? Number(((estimatedProfit / totalBudget) * 100).toFixed(2)) : 0;
  const budgetUtilizedPercentage = totalBudget > 0 ? Number(((totalAccumulatedExpenses / totalBudget) * 100).toFixed(2)) : 0;

  // Category breakdown
  const categoryBreakdown = ExpenseCategories.map(cat => {
    const catExpenses = allProjectExpenses.filter(e => e.category === cat);
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalAccumulatedExpenses > 0 
      ? Number(((total / totalAccumulatedExpenses) * 100).toFixed(1))
      : 0;
    return {
      category: cat,
      total,
      percentage,
      count: catExpenses.length
    };
  });

  return {
    project_id: project.id,
    project_name: project.project_name,
    selected_date: targetDate,
    selected_month: monthPrefix,
    total_budget: totalBudget,
    today_expense: todayExpense,
    monthly_total: monthlyTotal,
    total_accumulated_expenses: totalAccumulatedExpenses,
    remaining_budget: remainingBudget,
    estimated_profit: estimatedProfit,
    profit_margin_percentage: profitMarginPercentage,
    budget_utilized_percentage: budgetUtilizedPercentage,
    category_breakdown: categoryBreakdown,
    recent_expenses_count: allProjectExpenses.length
  };
}
