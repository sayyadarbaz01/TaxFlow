import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { ValidationError } from "../../middleware/errorHandler";

export class AdminController {
  public static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listUsers(req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await AdminService.getRoles();
      return res.json(roles);
    } catch (err) {
      next(err);
    }
  }

  public static async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionNames } = req.body;
      if (!Array.isArray(permissionNames)) {
        throw new ValidationError("permissionNames array is required");
      }

      const result = await AdminService.updateRolePermissions(req.params.roleId, permissionNames, req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listAuditLogs(req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
