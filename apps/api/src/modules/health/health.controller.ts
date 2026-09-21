import { Request, Response } from "express";
import { prisma } from "../../lib/db";
import { config } from "../../config";

export class HealthController {
  public static async getHealth(_req: Request, res: Response) {
    return res.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      service: "CA SaaS API",
      uptime: process.uptime()
    });
  }

  public static async getDbHealth(_req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ status: "UP", database: "PostgreSQL" });
    } catch (err: any) {
      return res.status(500).json({ status: "DOWN", database: "PostgreSQL", error: err.message });
    }
  }

  public static async getGeminiHealth(_req: Request, res: Response) {
    if (!config.gemini.apiKey) {
      return res.status(503).json({
        status: "DOWN",
        service: "Gemini",
        message: "GEMINI_API_KEY is not configured"
      });
    }
    return res.json({
      status: "UP",
      service: "Gemini",
      model: config.gemini.model,
      configured: true
    });
  }
}
