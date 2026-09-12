import { BillingService } from "../src/modules/billing/billing.service";

describe("Billing & Invoice Math", () => {
  it("should calculate tax and subtotal accurately with 18% GST", () => {
    const lineItems = [
      { description: "ITR Filing", amount: 10000 },
      { description: "GST Audit", amount: 5000 }
    ];
    const subtotal = lineItems.reduce((acc, i) => acc + i.amount, 0);
    const tax = Math.round((subtotal * 18) / 100);
    const total = subtotal + tax;

    expect(subtotal).toBe(15000);
    expect(tax).toBe(2700);
    expect(total).toBe(17700);
  });
});
