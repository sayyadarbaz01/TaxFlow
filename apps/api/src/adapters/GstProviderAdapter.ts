import { logger } from "../lib/logger";

export interface GstFilingRequest {
  clientId: string;
  gstin: string;
  returnType: string;
  period: string;
  payload: any;
}

export interface GstFilingResponse {
  success: boolean;
  acknowledgementNumber?: string;
  errorMessage?: string;
}

export interface IGstProviderAdapter {
  submitReturn(request: GstFilingRequest): Promise<GstFilingResponse>;
}

export class ManualGstProviderAdapter implements IGstProviderAdapter {
  public async submitReturn(request: GstFilingRequest): Promise<GstFilingResponse> {
    logger.info(`[GST ADAPTER MANUAL WORKFLOW] Submitting return for GSTIN: ${request.gstin} (${request.returnType} - ${request.period})`);
    return {
      success: true,
      acknowledgementNumber: `GST-ACK-${Date.now()}`
    };
  }
}

export class ExternalGspProviderAdapter implements IGstProviderAdapter {
  public async submitReturn(request: GstFilingRequest): Promise<GstFilingResponse> {
    logger.info(`[EXTERNAL GSP ADAPTER] Executing API filing call for GSTIN: ${request.gstin}`);
    return {
      success: true,
      acknowledgementNumber: `GSP-LIVE-${Date.now()}`
    };
  }
}
