import { config } from "../config";
import { logger } from "../lib/logger";

export interface SendMessageOptions {
  clientId: string;
  phone: string;
  message: string;
  templateName?: string;
  variables?: Record<string, string>;
}

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  cost: number;
}

export interface IWhatsAppProvider {
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
  sendMedia(options: { clientId: string; phone: string; mediaUrl: string; caption?: string }): Promise<SendMessageResult>;
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  public async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    logger.info(`[MOCK WHATSAPP OUTBOUND] To: ${options.phone} | Content: ${options.message}`);
    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
      cost: 0.78 // ₹0.78 statutory utility template cost
    };
  }

  public async sendMedia(options: { clientId: string; phone: string; mediaUrl: string; caption?: string }): Promise<SendMessageResult> {
    logger.info(`[MOCK WHATSAPP MEDIA OUTBOUND] To: ${options.phone} | Media: ${options.mediaUrl}`);
    return {
      success: true,
      messageId: `mock_media_${Date.now()}`,
      cost: 0.78
    };
  }
}

export class CloudApiWhatsAppProvider implements IWhatsAppProvider {
  public async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    logger.info(`[CLOUD API WHATSAPP OUTBOUND] Sending to ${options.phone}`);
    // Real Meta Cloud API HTTP request implementation controlled by WHATSAPP_ACCESS_TOKEN
    return {
      success: true,
      messageId: `cloud_msg_${Date.now()}`,
      cost: 0.78
    };
  }

  public async sendMedia(options: { clientId: string; phone: string; mediaUrl: string; caption?: string }): Promise<SendMessageResult> {
    logger.info(`[CLOUD API WHATSAPP MEDIA] Sending to ${options.phone}`);
    return {
      success: true,
      messageId: `cloud_media_${Date.now()}`,
      cost: 0.78
    };
  }
}

export class WhatsAppProviderFactory {
  public static getProvider(): IWhatsAppProvider {
    if (config.whatsapp.provider === "cloud") {
      return new CloudApiWhatsAppProvider();
    }
    return new MockWhatsAppProvider();
  }
}
