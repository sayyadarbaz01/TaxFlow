import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/db";
import { logger } from "../../lib/logger";

export class WebhooksController {
  /**
   * Inbound WhatsApp Webhook
   */
  public static async handleWhatsAppInbound(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, body, mediaUrl, docType } = req.body;
      logger.info({ phone, body, mediaUrl }, "📱 Inbound WhatsApp Webhook received");

      if (!phone) {
        return res.status(400).json({ error: "Missing sender phone number" });
      }

      // Match phone number with active client
      const client = await prisma.client.findFirst({
        where: { contactPhone: { contains: phone.slice(-10) } }
      });

      if (!client) {
        logger.warn(`Unmatched inbound WhatsApp message from phone: ${phone}. Storing unattached log.`);
        return res.status(200).json({ status: "UNMATCHED_PHONE_LOGGED" });
      }

      // Record inbound WhatsApp message
      await prisma.whatsAppMessage.create({
        data: {
          clientId: client.id,
          direction: "INBOUND",
          body: body || "Inbound media file",
          status: "RECEIVED",
          cost: 0
        }
      });

      // Auto-attach document if mediaUrl is provided
      if (mediaUrl) {
        await prisma.clientDocument.create({
          data: {
            clientId: client.id,
            docType: docType || "OTHER",
            fileName: `WhatsApp_Attachment_${Date.now()}.pdf`,
            fileUrl: mediaUrl,
            uploadedBy: "Client WhatsApp",
            source: "WHATSAPP",
            status: "PENDING"
          }
        });
        logger.info(`Attached document to client ${client.name} via WhatsApp inbound`);
      }

      return res.status(200).json({ status: "SUCCESS", clientId: client.id });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyWhatsAppWebhook(req: Request, res: Response) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
}
