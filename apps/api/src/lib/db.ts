import { PrismaClient } from "@prisma/client";
import { recordDbQueryMetric } from "../middleware/performanceProfiler";

let circuitOpenUntil = 0;
let consecutiveFailures = 0;

export function isDbCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function tripDbCircuit(durationMs = 600_000) {
  circuitOpenUntil = Date.now() + durationMs;
}

export function resetDbCircuit() {
  circuitOpenUntil = 0;
  consecutiveFailures = 0;
}

/**
 * Configure production-ready connection pooling for Prisma Client
 * Sets optimal connection limit and fast acquisition timeout to prevent connection starvation
 */
function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  const hasLimit = rawUrl.includes("connection_limit=");
  const hasTimeout = rawUrl.includes("pool_timeout=");
  const hasConnectTimeout = rawUrl.includes("connect_timeout=");

  const separator = rawUrl.includes("?") ? "&" : "?";
  const params: string[] = [];
  if (!hasLimit) params.push("connection_limit=20");
  if (!hasTimeout) params.push("pool_timeout=2"); // Fast 2s pool wait max
  if (!hasConnectTimeout) params.push("connect_timeout=2"); // Fast 2s connect wait max

  return `${rawUrl}${separator}${params.join("&")}`;
}

const dbUrl = getDatabaseUrl();

export const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

// High-speed circuit breaker & timing middleware
prisma.$use(async (params, next) => {
  if (isDbCircuitOpen()) {
    throw new Error("DatabaseCircuitOpen: Connection offline");
  }

  const start = Date.now();
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    recordDbQueryMetric(duration);
    resetDbCircuit();
    return result;
  } catch (err: any) {
    consecutiveFailures++;
    const errMsg = err?.message || "";
    if (
      consecutiveFailures >= 1 ||
      errMsg.includes("Can't reach database server") ||
      errMsg.includes("Authentication failed") ||
      err?.code === "P1001" ||
      err?.code === "P1000"
    ) {
      tripDbCircuit(600_000); // Fast circuit trip: drop connection wait for 10 minutes
    }
    throw err;
  }
});
