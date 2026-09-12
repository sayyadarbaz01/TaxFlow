import { Request, Response, NextFunction } from "express";
import { GstService } from "./gst.service";
import { GstReturnType, GstFilingFrequency } from "@ca-saas/shared-types";
import { ValidationError } from "../../middleware/errorHandler";

export class GstController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GstService.listReturns(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getUpcomingDue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GstService.getUpcomingDue(req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, returnType, period, filingFrequency } = req.body;
      if (!clientId || !returnType || !period) {
        throw new ValidationError("clientId, returnType, and period are required");
      }

      const returnRecord = await GstService.createReturn(
        clientId,
        returnType as GstReturnType,
        period,
        (filingFrequency || "MONTHLY") as GstFilingFrequency,
        req.user!
      );

      return res.status(201).json(returnRecord);
    } catch (err) {
      next(err);
    }
  }

  public static async markFiled(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await GstService.markFiled(req.params.id, req.user!);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}
