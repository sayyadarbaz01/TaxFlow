import { DueDateEngine } from "../src/lib/due-date-engine";

describe("DueDateEngine — ITR statutory due dates", () => {
  it("TC-ITR-01: non-audit ITR-1 → 31 July of AY start year", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_1",
      isAuditRequired: false
    });
    expect(d).toEqual(new Date(2026, 6, 31));
  });

  it("TC-ITR-02: ITR-2 non-audit → 31 July", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_2"
    });
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(31);
  });

  it("TC-ITR-03: ITR-4 non-audit → 31 July", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2025-26",
      formType: "ITR_4"
    });
    expect(d).toEqual(new Date(2025, 6, 31));
  });

  it("TC-ITR-04: audit required → 31 October", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_1",
      isAuditRequired: true
    });
    expect(d).toEqual(new Date(2026, 9, 31));
  });

  it("TC-ITR-05: ITR-3 implies audit window → 31 October", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_3"
    });
    expect(d).toEqual(new Date(2026, 9, 31));
  });

  it("TC-ITR-06: ITR-5 → 31 October", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_5"
    });
    expect(d).toEqual(new Date(2026, 9, 31));
  });

  it("TC-ITR-07: ITR-6 company → 30 November", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_6"
    });
    expect(d).toEqual(new Date(2026, 10, 30));
  });

  it("TC-ITR-08: transfer pricing → 30 November", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_2",
      isTransferPricing: true
    });
    expect(d).toEqual(new Date(2026, 10, 30));
  });

  it("TC-ITR-09: belated filing → 31 December of AY year", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_1",
      filingCategory: "BELATED"
    });
    expect(d).toEqual(new Date(2026, 11, 31));
  });

  it("TC-ITR-10: revised filing → 31 December", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_2",
      filingCategory: "REVISED"
    });
    expect(d).toEqual(new Date(2026, 11, 31));
  });

  it("TC-ITR-11: updated return → 31 March of following year", () => {
    const d = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_1",
      filingCategory: "UPDATED"
    });
    expect(d).toEqual(new Date(2027, 2, 31));
  });
});

describe("DueDateEngine — GST statutory due dates", () => {
  it("TC-GST-01: GSTR9 annual → 31 December", () => {
    const d = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR9",
      period: "FY 2025-26",
      frequency: "MONTHLY",
      year: 2026
    });
    expect(d).toEqual(new Date(2026, 11, 31));
  });

  it("TC-GST-02: GSTR1 monthly → 11th of next month", () => {
    const d = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR1",
      period: "August 2026",
      frequency: "MONTHLY",
      year: 2026
    });
    expect(d.getDate()).toBe(11);
  });

  it("TC-GST-03: GSTR1 QRMP → 13th", () => {
    const d = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR1",
      period: "Q2 2026",
      frequency: "QRMP",
      year: 2026
    });
    expect(d.getDate()).toBe(13);
  });

  it("TC-GST-04: GSTR3B monthly → 20th of next month", () => {
    const d = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR3B",
      period: "August 2026",
      frequency: "MONTHLY",
      year: 2026
    });
    expect(d.getDate()).toBe(20);
  });

  it("TC-GST-05: GSTR3B QRMP → 22nd", () => {
    const d = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR3B",
      period: "Q1 2026",
      frequency: "QRMP",
      year: 2026
    });
    expect(d.getDate()).toBe(22);
  });
});
