import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createExpenseRecord, getExpensesList, deleteExpenseRecord, getProject } from '../config/db';
import { ExpenseCategories } from '../types';

const CreateExpenseSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  category: z.enum(ExpenseCategories, {
    errorMap: () => ({
      message: `Category must be one of: ${ExpenseCategories.join(', ')}`
    })
  }),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().default('')
});

export async function createExpenseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = CreateExpenseSchema.parse(req.body);

    // Verify project exists
    const project = await getProject(validated.project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with ID '${validated.project_id}' was not found.`
      });
    }

    const newExpense = await createExpenseRecord({
      project_id: validated.project_id,
      date: validated.date,
      category: validated.category,
      amount: validated.amount,
      remarks: validated.remarks
    });

    return res.status(201).json({
      success: true,
      data: newExpense,
      message: 'Expense recorded successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpensesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = (req.query.projectId || req.query.project_id) as string;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter projectId is required'
      });
    }

    const date = req.query.date as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const expenses = await getExpensesList({
      project_id: projectId,
      date,
      category,
      search
    });

    return res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpenseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Expense ID is required'
      });
    }

    const deleted = await deleteExpenseRecord(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Expense with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}
