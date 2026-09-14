import { app } from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";
import { prisma, isDbCircuitOpen, resetDbCircuit, tripDbCircuit } from "./lib/db";

async function startServer() {
  try {
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 10_000)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    resetDbCircuit();
    logger.info("Connected to PostgreSQL database successfully via Prisma");
  } catch (err: any) {
    tripDbCircuit(30_000);
    logger.warn(
      { message: err.message },
      "PostgreSQL database connection slow or offline. Circuit breaker active with 30s auto-retry."
    );
  }

  // Non-blocking background reconnect probe every 30s
  setInterval(async () => {
    if (isDbCircuitOpen()) {
      try {
        const pingPromise = prisma.$queryRaw`SELECT 1`;
        const pingTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Database probe timeout")), 5_000)
        );
        await Promise.race([pingPromise, pingTimeout]);
        resetDbCircuit();
        logger.info("PostgreSQL database connection restored. Circuit reset to live database.");
      } catch {
        tripDbCircuit(30_000);
      }
    }
  }, 30_000).unref();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 CA SaaS API Server running on ${config.apiUrl} [${config.env}]`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${config.port} is already in use by another process.`);
      process.exit(1);
    } else {
      logger.error({ err }, "Server listen error");
    }
  });
}

startServer();
// tsx-reload
