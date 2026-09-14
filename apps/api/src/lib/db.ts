import { PrismaClient } from "@prisma/client";
import { recordDbQueryMetric } from "../middleware/performanceProfiler";

let circuitOpenUntil = 0;
let consecutiveFailures = 0;

export function isDbCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function tripDbCircuit(durationMs = 30_000) {
  circuitOpenUntil = Date.now() + durationMs;
}

export function resetDbCircuit() {
  circuitOpenUntil = 0;
  consecutiveFailures = 0;
}

/**
 * Configure production-ready connection pooling for Prisma Client
 * Sets optimal connection limit and resilient acquisition timeouts for cloud databases
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
  if (!hasTimeout) params.push("pool_timeout=10"); // 10s pool wait for cloud DB
  if (!hasConnectTimeout) params.push("connect_timeout=10"); // 10s connect wait for TLS handshake

  return `${rawUrl}${separator}${params.join("&")}`;
}

const dbUrl = getDatabaseUrl();

export const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

// High-speed circuit breaker & timing middleware
prisma.$use(async (params, next) => {
  // Allow healthcheck pings to execute even if circuit is currently open
  const isProbeQuery =
    params.action === "queryRaw" ||
    (params.action as any) === "$queryRaw" ||
    params.action === "executeRaw";

  if (isDbCircuitOpen() && !isProbeQuery) {
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
    const errMsg = err?.message || "";
    const isConnectionError =
      err?.code === "P1001" ||
      err?.code === "P1000" ||
      err?.code === "P1002" ||
      err?.code === "P1008" ||
      err?.name === "PrismaClientInitializationError" ||
      errMsg.includes("Can't reach database server") ||
      errMsg.includes("Authentication failed") ||
      errMsg.includes("ECONNREFUSED") ||
      errMsg.includes("ETIMEDOUT") ||
      errMsg.includes("Connection terminated unexpectedly");

    if (isConnectionError) {
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        tripDbCircuit(30_000); // 30s protective window
      }
    }
    throw err;
  }
});
