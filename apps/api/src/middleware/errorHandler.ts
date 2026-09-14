import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const formattedDetails = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join("; ");

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: formattedDetails ? `Invalid input: ${formattedDetails}` : "Invalid input parameters",
        details: fieldErrors
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle Prisma-specific database errors
  if (err?.code === "P2002") {
    const target = err.meta?.target;
    const targetStr = Array.isArray(target) ? target.join(", ") : String(target || "");
    const fieldMsg = targetStr ? ` (${targetStr.toUpperCase()})` : "";
    return res.status(409).json({
      error: {
        code: "CONFLICT",
        message: `A record with this unique identifier${fieldMsg} already exists.`,
        details: err.meta
      }
    });
  }

  if (err?.code === "P2003") {
    return res.status(400).json({
      error: {
        code: "INVALID_RELATION",
        message: "Referenced entity does not exist or foreign key constraint failed.",
        details: err.meta
      }
    });
  }

  if (err?.code === "P2025") {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Requested database record was not found.",
        details: err.meta
      }
    });
  }

  const isDbUnavailable =
    err?.code === "P1001" ||
    err?.code === "P1000" ||
    err?.code === "P1002" ||
    err?.name === "PrismaClientInitializationError" ||
    err?.message?.includes("DatabaseCircuitOpen") ||
    err?.message?.includes("Can't reach database server");

  if (isDbUnavailable) {
    return res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database service is temporarily unavailable. Please retry in a few moments."
      }
    });
  }

  logger.error({ err }, "Unhandled Server Error");

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
    }
  });
}
  