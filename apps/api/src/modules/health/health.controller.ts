import { Request, Response } from "express";
import fetch from "node-fetch";
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

  public static async getOllamaHealth(_req: Request, res: Response) {
    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return res.json({ status: "UP", service: "Ollama", models: data });
      }
      return res.status(503).json({ status: "DOWN", service: "Ollama" });
    } catch (err: any) {
      return res.status(503).json({ status: "DOWN", service: "Ollama", message: err.message });
    }
  }
}
