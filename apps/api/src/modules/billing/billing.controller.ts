import { Request, Response, NextFunction } from "express";
import { BillingService } from "./billing.service";
import { ValidationError } from "../../middleware/errorHandler";

export class BillingController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillingService.listInvoices(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await BillingService.getInvoiceById(req.params.id, req.user!);
      return res.json(invoice);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, lineItems, dueDate, taxRatePercentage } = req.body;
      if (!clientId || !lineItems || !Array.isArray(lineItems) || !dueDate) {
        throw new ValidationError("clientId, lineItems array, and dueDate are required");
      }

      const invoice = await BillingService.createInvoice(
        clientId,
        lineItems,
        dueDate,
        taxRatePercentage !== undefined ? Number(taxRatePercentage) : 18,
        req.user!
      );

      return res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  }

  public static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { method } = req.body;
      const result = await BillingService.markPaid(req.params.id, method || "UPI", req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getUpiLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillingService.getUpiLink(req.params.id);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
