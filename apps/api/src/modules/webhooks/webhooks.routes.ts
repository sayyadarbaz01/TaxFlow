import { Router } from "express";
import { WebhooksController } from "./webhooks.controller";

const router = Router();

router.get("/whatsapp", WebhooksController.verifyWhatsAppWebhook);
router.post("/whatsapp", WebhooksController.handleWhatsAppInbound);

export default router;
