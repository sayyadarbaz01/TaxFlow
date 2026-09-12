import { Request, Response, NextFunction } from "express";
import { ItrService } from "./itr.service";
import { ItrFormType, ItrStatus } from "@ca-saas/shared-types";
import { ValidationError } from "../../middleware/errorHandler";

export class ItrController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ItrService.listFilings(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const filing = await ItrService.getFilingById(req.params.id, req.user!);
      return res.json(filing);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, assessmentYear, itrFormType, isAuditRequired } = req.body;
      if (!clientId || !assessmentYear || !itrFormType) {
        throw new ValidationError("clientId, assessmentYear, and itrFormType are required");
      }

      const filing = await ItrService.createFiling(
        clientId,
        assessmentYear,
        itrFormType as ItrFormType,
        Boolean(isAuditRequired),
        req.user!
      );

      return res.status(201).json(filing);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, acknowledgementNo, refundStatus } = req.body;
      if (!status) throw new ValidationError("status field is required");

      const updated = await ItrService.updateFilingStatus(
        req.params.id,
        status as ItrStatus,
        { acknowledgementNo, refundStatus },
        req.user!
      );

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}
