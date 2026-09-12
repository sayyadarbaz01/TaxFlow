import { Request, Response, NextFunction } from "express";
import { AiService } from "./ai.service";
import { ValidationError } from "../../middleware/errorHandler";

export class AiController {
  public static async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, conversationId } = req.body;
      if (!query) throw new ValidationError("query string is required");

      const result = await AiService.processQuery(query, req.user!, conversationId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await AiService.getConversations(req.user!.id);
      return res.json(conversations);
    } catch (err) {
      next(err);
    }
  }
}
