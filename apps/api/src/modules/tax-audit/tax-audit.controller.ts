import { Request, Response, NextFunction } from "express";
import { TaxAuditService } from "./tax-audit.service";
import { AuthUser } from "@ca-saas/shared-types";

export class TaxAuditController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await TaxAuditService.listEngagements(user, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await TaxAuditService.getSummary(user);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await TaxAuditService.createEngagement(req.body, user);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as AuthUser;
      const result = await TaxAuditService.updateStage(req.params.id, req.body, user);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getClauses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TaxAuditService.getClauses(req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async updateClause(req: Request, res: Response, next: NextFunction) {
    try {
      const clauseNumber = parseInt(req.params.clauseNumber, 10);
      const { status, remarks } = req.body;
      const result = await TaxAuditService.updateClauseStatus(req.params.id, clauseNumber, status, remarks);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
