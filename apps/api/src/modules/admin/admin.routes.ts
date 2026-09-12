import { Router } from "express";
import { AdminController } from "./admin.controller";
import { requireAuth } from "../../middleware/auth";
import { requireSuperAdmin, requireRole } from "../../middleware/roles";

const router = Router();

router.use(requireAuth);

// Both SuperAdmin and Admin can list users/staff for client assignments
router.get("/users", requireRole(["SuperAdmin", "Admin"]), AdminController.listUsers);

// Only SuperAdmin can manage roles and view audit logs
router.get("/roles", requireSuperAdmin, AdminController.getRoles);
router.put("/roles/:roleId/permissions", requireSuperAdmin, AdminController.updateRolePermissions);
router.get("/audit-logs", requireSuperAdmin, AdminController.listAuditLogs);

export default router;
