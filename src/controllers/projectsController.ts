import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getAllProjects, getProject, createProjectRecord } from '../config/db';

const CreateProjectSchema = z.object({
  project_name: z.string().min(2, 'Project name must be at least 2 characters'),
  total_budget: z.coerce.number().positive('Total budget must be a positive number'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional().default(() => new Date().toISOString().split('T')[0]),
  currency: z.string().min(1).max(5).optional().default('USD')
});

export async function getProjectsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await getAllProjects();
    return res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const project = await getProject(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
}

export async function createProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = CreateProjectSchema.parse(req.body);
    const newProject = await createProjectRecord(validated);
    return res.status(201).json({
      success: true,
      data: newProject,
      message: 'Project created successfully'
    });
  } catch (error) {
    next(error);
  }
}
