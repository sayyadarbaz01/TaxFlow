import { Request, Response, NextFunction } from "express";
import { TdsTcsService } from "./tds-tcs.service";
import { TdsEntryType } from "@ca-saas/shared-types";
import { ValidationError } from "../../middleware/errorHandler";

export class TdsTcsController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TdsTcsService.listEntries(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, financialYear, deductorTan, expectedAmount, creditedAmount, entryType } = req.body;
      if (!clientId || !financialYear || !deductorTan || expectedAmount === undefined) {
        throw new ValidationError("clientId, financialYear, deductorTan, and expectedAmount are required");
      }

      const entry = await TdsTcsService.createEntry(
        clientId,
        financialYear,
        deductorTan,
        Number(expectedAmount),
        Number(creditedAmount || 0),
        (entryType || "TDS") as TdsEntryType,
        req.user!
      );

      return res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  }
}
