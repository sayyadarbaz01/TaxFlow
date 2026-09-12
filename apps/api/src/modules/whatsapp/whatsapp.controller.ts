import { Request, Response, NextFunction } from "express";
import { WhatsAppService } from "./whatsapp.service";
import { ValidationError } from "../../middleware/errorHandler";

export class WhatsAppController {
  public static async listMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WhatsAppService.listMessages(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getMonthlySpend(req: Request, res: Response, next: NextFunction) {
    try {
      const spend = await WhatsAppService.getMonthlySpend();
      return res.json(spend);
    } catch (err) {
      next(err);
    }
  }

  public static async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await WhatsAppService.listTemplates();
      return res.json(templates);
    } catch (err) {
      next(err);
    }
  }

  public static async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, category, body, variables } = req.body;
      if (!name || !body) throw new ValidationError("name and body are required for template");

      const template = await WhatsAppService.createTemplate(name, category, body, variables || [], req.user!);
      return res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }

  public static async sendTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, templateName, variables } = req.body;
      if (!clientId || !templateName) throw new ValidationError("clientId and templateName are required");

      const message = await WhatsAppService.sendTemplateMessage(clientId, templateName, variables || {}, req.user!);
      return res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
}
