import { Request, Response, NextFunction } from "express";
import { GstRegistrationService } from "./gst-registration.service";
import { AuthUser } from "@ca-saas/shared-types";

export class GstRegistrationController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await GstRegistrationService.listApplications(user, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await GstRegistrationService.getSummary(user);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await GstRegistrationService.createApplication(req.body, user);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async advanceStage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await GstRegistrationService.advanceStage(req.params.id, req.body, user);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async syncToClient(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await GstRegistrationService.syncToClient(req.params.id, user);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
