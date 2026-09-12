export interface ItrRuleInput {
  assessmentYear: string; // e.g. "AY 2026-27"
  formType: "ITR_1" | "ITR_2" | "ITR_3" | "ITR_4" | "ITR_5" | "ITR_6";
  isAuditRequired?: boolean;
  isTransferPricing?: boolean;
  filingCategory?: "ORIGINAL" | "BELATED" | "REVISED" | "UPDATED";
}

export interface GstRuleInput {
  returnType: "GSTR1" | "GSTR3B" | "GSTR9";
  period: string; // e.g. "August 2026" or "Q2 2026"
  frequency: "MONTHLY" | "QRMP";
  year?: number;
}

export class DueDateEngine {
  /**
   * Data-driven ITR Statutory Due Date Calculation
   */
  public static calculateItrDueDate(input: ItrRuleInput): Date {
    const ayYear = parseInt(input.assessmentYear.split(" ")[1].split("-")[0], 10);

    if (input.filingCategory === "BELATED" || input.filingCategory === "REVISED") {
      return new Date(ayYear, 11, 31); // 31st December of AY
    }

    if (input.filingCategory === "UPDATED") {
      return new Date(ayYear + 1, 2, 31); // 31st March following AY
    }

    if (input.isTransferPricing || input.formType === "ITR_6") {
      return new Date(ayYear, 10, 30); // 30th November
    }

    if (input.isAuditRequired || input.formType === "ITR_3" || input.formType === "ITR_5") {
      return new Date(ayYear, 9, 31); // 31st October
    }

    // Default Non-Audit (ITR-1, ITR-2, ITR-4)
    return new Date(ayYear, 6, 31); // 31st July
  }

  /**
   * Data-driven GST Statutory Due Date Calculation
   */
  public static calculateGstDueDate(input: GstRuleInput): Date {
    const now = new Date();
    const currentYear = input.year || now.getFullYear();

    if (input.returnType === "GSTR9") {
      return new Date(currentYear, 11, 31); // 31st December
    }

    if (input.returnType === "GSTR1") {
      if (input.frequency === "MONTHLY") {
        const monthIndex = now.getMonth();
        return new Date(currentYear, monthIndex + 1, 11); // 11th of next month
      } else {
        const monthIndex = now.getMonth();
        return new Date(currentYear, monthIndex + 1, 13); // 13th after quarter
      }
    }

    if (input.returnType === "GSTR3B") {
      if (input.frequency === "MONTHLY") {
        const monthIndex = now.getMonth();
        return new Date(currentYear, monthIndex + 1, 20); // 20th of next month
      } else {
        const monthIndex = now.getMonth();
        return new Date(currentYear, monthIndex + 1, 22); // 22nd after quarter
      }
    }

    return new Date(currentYear, now.getMonth() + 1, 20);
  }
}
