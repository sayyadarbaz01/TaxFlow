import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "./errorHandler";
import { SystemRole } from "@ca-saas/shared-types";

export function requireRole(allowedRoles: SystemRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("User authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access restricted to ${allowedRoles.join(" / ")}`));
    }

    next();
  };
}

export const requireSuperAdmin = requireRole(["SuperAdmin"]);
