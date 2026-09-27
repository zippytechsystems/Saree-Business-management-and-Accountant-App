import { Request, Response, NextFunction } from 'express';
import { getAnalyticsData } from '../config/db';

export async function getAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = (req.params.projectId || req.query.projectId || req.query.project_id) as string;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // Default to today's date if not passed
    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    
    // Validate targetDate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({
        success: false,
        error: 'Date must be formatted as YYYY-MM-DD'
      });
    }

    const analytics = await getAnalyticsData(projectId, targetDate);
    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: `Project with ID '${projectId}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}
