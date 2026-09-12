import { Router } from "express";
import { WhatsAppController } from "./whatsapp.controller";
import { requireAuth } from "../../middleware/auth";
import { whatsappRateLimiter } from "../../middleware/rateLimit";

const router = Router();

router.use(requireAuth);

router.get("/messages", WhatsAppController.listMessages);
router.get("/spend/monthly", WhatsAppController.getMonthlySpend);
router.get("/templates", WhatsAppController.listTemplates);
router.post("/templates", WhatsAppController.createTemplate);
router.post("/send", whatsappRateLimiter, WhatsAppController.sendTemplate);

export default router;
