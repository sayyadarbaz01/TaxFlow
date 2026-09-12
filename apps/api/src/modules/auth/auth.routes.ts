import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";
import { requireSuperAdmin } from "../../middleware/roles";
import { authRateLimiter } from "../../middleware/rateLimit";

const router = Router();

router.post("/login", authRateLimiter, AuthController.login);
router.post("/signup", authRateLimiter, AuthController.signup);
router.post("/register", requireAuth, requireSuperAdmin, AuthController.registerInvite);
router.post("/refresh", AuthController.refresh);
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);

export default router;
