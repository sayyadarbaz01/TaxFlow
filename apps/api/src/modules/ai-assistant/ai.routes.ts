import { Router } from "express";
import { AiController } from "./ai.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/query", AiController.ask);
router.get("/conversations", AiController.getConversations);

export default router;
