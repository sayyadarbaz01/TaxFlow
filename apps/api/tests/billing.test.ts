import {
  calculateInvoiceTotals,
  buildUpiPaymentLink
} from "../src/modules/billing/billing.service";

describe("Billing — invoice math & UPI link", () => {
  it("TC-BILL-01: 18% GST on multi line items", () => {
    const { subtotal, tax, total } = calculateInvoiceTotals(
      [
        { amount: 10000 },
        { amount: 5000 }
      ],
      18
    );
    expect(subtotal).toBe(15000);
    expect(tax).toBe(2700);
    expect(total).toBe(17700);
  });

  it("TC-BILL-02: rounds tax with Math.round", () => {
    // 100 * 18% = 18 exact
    expect(calculateInvoiceTotals([{ amount: 100 }], 18)).toEqual({
      subtotal: 100,
      tax: 18,
      total: 118
    });
  });

  it("TC-BILL-03: zero line items → zero totals", () => {
    expect(calculateInvoiceTotals([], 18)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it("TC-BILL-04: custom tax rate 0%", () => {
    expect(calculateInvoiceTotals([{ amount: 2000 }], 0)).toEqual({
      subtotal: 2000,
      tax: 0,
      total: 2000
    });
  });

  it("TC-BILL-05: UPI deep link encodes amount and invoice number", () => {
    const link = buildUpiPaymentLink(17700, "INV-2026-001");
    expect(link).toContain("upi://pay?");
    expect(link).toContain("am=17700");
    expect(link).toContain("tn=INV-2026-001");
    expect(link).toContain("cu=INR");
  });
});
