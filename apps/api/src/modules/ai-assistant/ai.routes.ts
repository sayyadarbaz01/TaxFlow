import { Router } from "express";
import { AiController } from "./ai.controller";
import { requireAuth } from "../../middleware/auth";
import { aiRateLimiter } from "../../middleware/rateLimit";

const router = Router();

router.use(requireAuth);
router.use(aiRateLimiter);

router.post("/query", AiController.ask);
router.get("/conversations", AiController.getConversations);

export default router;
