import { computeTdsReconciliation } from "../src/modules/tds-tcs/tds-tcs.service";

describe("TDS/TCS reconciliation business rules", () => {
  it("TC-TDS-01: exact match → MATCHED with zero mismatch", () => {
    expect(computeTdsReconciliation(50000, 50000)).toEqual({
      mismatchAmount: 0,
      reconciliationStatus: "MATCHED"
    });
  });

  it("TC-TDS-02: credited less than expected → MISMATCH_UNDER", () => {
    expect(computeTdsReconciliation(50000, 45000)).toEqual({
      mismatchAmount: 5000,
      reconciliationStatus: "MISMATCH_UNDER"
    });
  });

  it("TC-TDS-03: credited more than expected → MISMATCH_OVER", () => {
    expect(computeTdsReconciliation(50000, 52000)).toEqual({
      mismatchAmount: 2000,
      reconciliationStatus: "MISMATCH_OVER"
    });
  });

  it("TC-TDS-04: mismatch amount is absolute difference", () => {
    expect(computeTdsReconciliation(100, 0).mismatchAmount).toBe(100);
    expect(computeTdsReconciliation(0, 100).mismatchAmount).toBe(100);
  });
});
