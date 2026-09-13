import { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { logger } from "../lib/logger";

export interface RequestTimingProfile {
  startHrTime: [number, number];
  startTime: number;
  middlewareMs: number;
  authMs: number;
  controllerMs: number;
  serviceMs: number;
  dbQueryMs: number;
  dbConnectionMs: number;
  queryCount: number;
  externalApiMs: number;
  transformationMs: number;
  serializationMs: number;
  totalMs: number;
}

declare global {
  namespace Express {
    interface Request {
      profile?: RequestTimingProfile;
    }
  }
}

export const profilerStorage = new AsyncLocalStorage<RequestTimingProfile>();

export function recordDbQueryMetric(durationMs: number) {
  const store = profilerStorage.getStore();
  if (store) {
    store.dbQueryMs += durationMs;
    store.queryCount += 1;
  }
}

export function performanceProfiler(req: Request, res: Response, next: NextFunction) {
  const startHrTime = process.hrtime();
  const startTime = Date.now();

  const profile: RequestTimingProfile = {
    startHrTime,
    startTime,
    middlewareMs: 0,
    authMs: 0,
    controllerMs: 0,
    serviceMs: 0,
    dbQueryMs: 0,
    dbConnectionMs: 0,
    queryCount: 0,
    externalApiMs: 0,
    transformationMs: 0,
    serializationMs: 0,
    totalMs: 0
  };

  req.profile = profile;

  // Intercept serialization timing
  const originalJson = res.json;
  res.json = function (body: any): Response {
    const serializationStart = process.hrtime();
    const result = originalJson.call(this, body);
    const serializationDiff = process.hrtime(serializationStart);
    if (req.profile) {
      req.profile.serializationMs = Math.round(serializationDiff[0] * 1000 + serializationDiff[1] / 1e6);
    }
    return result;
  };

  // Intercept res.end to safely set Server-Timing before headers are committed
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    if (!res.headersSent && req.profile) {
      const diff = process.hrtime(startHrTime);
      const totalMs = Math.round(diff[0] * 1000 + diff[1] / 1e6);
      req.profile.totalMs = totalMs;
      const remainingMs = Math.max(0, totalMs - req.profile.dbQueryMs - req.profile.serializationMs);
      req.profile.transformationMs = remainingMs;

      try {
        res.setHeader(
          "Server-Timing",
          `total;dur=${totalMs}, db;dur=${req.profile.dbQueryMs}, queries;desc="${req.profile.queryCount}"`
        );
      } catch {}
    }
    return (originalEnd as any).call(this, chunk, encoding, callback);
  };

  // Log structured timing on completion
  res.on("finish", () => {
    const totalDiff = process.hrtime(startHrTime);
    const totalMs = Math.round(totalDiff[0] * 1000 + totalDiff[1] / 1e6);
    if (req.profile) {
      req.profile.totalMs = totalMs;
      const remainingMs = Math.max(0, totalMs - req.profile.dbQueryMs - req.profile.serializationMs);
      req.profile.transformationMs = remainingMs;

      const metrics = {
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode: res.statusCode,
        totalMs: req.profile.totalMs,
        dbConnectionMs: req.profile.dbConnectionMs,
        dbQueryMs: req.profile.dbQueryMs,
        externalApiMs: req.profile.externalApiMs,
        transformationMs: req.profile.transformationMs,
        serializationMs: req.profile.serializationMs,
        queryCount: req.profile.queryCount
      };

      if (totalMs > 100) {
        logger.warn({ profile: metrics }, `[PERF SLOW] ${req.method} ${req.originalUrl || req.path} took ${totalMs}ms`);
      } else {
        logger.info({ profile: metrics }, `[PERF OK] ${req.method} ${req.originalUrl || req.path} took ${totalMs}ms`);
      }
    }
  });

  profilerStorage.run(profile, () => {
    next();
  });
}
