import { Router } from "express";
import { HealthController } from "./health.controller";

const router = Router();

router.get("/", HealthController.getHealth);
router.get("/db", HealthController.getDbHealth);
router.get("/gemini", HealthController.getGeminiHealth);

export default router;
