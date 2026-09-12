import { Request, Response, NextFunction } from "express";
import { TasksService } from "./tasks.service";
import { TaskPriority, TaskStatus } from "@ca-saas/shared-types";
import { ValidationError } from "../../middleware/errorHandler";

export class TasksController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TasksService.listTasks(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, clientId, dueDate, priority, assignedTo } = req.body;
      if (!title || !clientId || !dueDate) {
        throw new ValidationError("title, clientId, and dueDate are required");
      }

      const task = await TasksService.createTask(
        title,
        clientId,
        dueDate,
        priority as TaskPriority,
        assignedTo,
        req.user!
      );

      return res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!status) throw new ValidationError("status is required");

      const updated = await TasksService.updateTaskStatus(req.params.id, status as TaskStatus, req.user!);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}
