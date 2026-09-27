export const ExpenseCategories = [
  'Cement',
  'Steel',
  'Sand',
  'Labor',
  'Transport',
  'Other'
] as const;

export type ExpenseCategory = typeof ExpenseCategories[number];

export interface Project {
  id: string;
  project_name: string;
  total_budget: number;
  start_date: string;
  currency?: string;
  status?: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  remarks: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

export interface AnalyticsSummary {
  project_id: string;
  project_name: string;
  selected_date: string;
  selected_month: string; // YYYY-MM
  total_budget: number;
  today_expense: number; // End of the day total expenses for selected date
  monthly_total: number; // Accumulated expenses for current selected month
  total_accumulated_expenses: number; // Project-wide total expenses
  remaining_budget: number; // total_budget - total_accumulated_expenses
  estimated_profit: number; // total_budget - total_accumulated_expenses
  profit_margin_percentage: number; // (estimated_profit / total_budget) * 100
  budget_utilized_percentage: number; // (total_accumulated_expenses / total_budget) * 100
  category_breakdown: CategoryBreakdown[];
  recent_expenses_count: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}
