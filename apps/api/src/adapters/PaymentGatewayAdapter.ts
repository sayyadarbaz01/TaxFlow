import { logger } from "../lib/logger";

export interface CreateOrderInput {
  invoiceId: string;
  amount: number;
  currency?: string;
}

export interface PaymentGatewayOrder {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface IPaymentGatewayAdapter {
  createOrder(input: CreateOrderInput): Promise<PaymentGatewayOrder>;
  verifyPaymentSignature(paymentId: string, orderId: string, signature: string): Promise<boolean>;
}

export class UpiDeepLinkPaymentAdapter implements IPaymentGatewayAdapter {
  public async createOrder(input: CreateOrderInput): Promise<PaymentGatewayOrder> {
    logger.info(`[UPI DEEP LINK] Generated order for invoice ${input.invoiceId} (₹${input.amount})`);
    return {
      orderId: `ORD-UPI-${Date.now()}`,
      amount: input.amount,
      currency: "INR",
      status: "CREATED"
    };
  }

  public async verifyPaymentSignature(_paymentId: string, _orderId: string, _signature: string): Promise<boolean> {
    return true;
  }
}
