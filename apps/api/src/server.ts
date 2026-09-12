import { app } from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";
import { prisma } from "./lib/db";

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL database successfully via Prisma");
  } catch (err: any) {
    logger.warn({ message: err.message }, "PostgreSQL database offline or starting up. API server running with mock fallback handlers.");
  }

  app.listen(config.port, () => {
    logger.info(`🚀 CA SaaS API Server running on ${config.apiUrl} [${config.env}]`);
  });
}

startServer();
// tsx-reload
