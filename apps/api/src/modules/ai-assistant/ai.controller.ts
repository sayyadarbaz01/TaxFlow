import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AiService } from "./ai.service";

const AskSchema = z.object({
  query: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional()
});

export class AiController {
  public static async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const body = AskSchema.parse(req.body);
      const result = await AiService.processQuery(
        body.query,
        req.user!,
        body.conversationId,
        body.clientId
      );
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
