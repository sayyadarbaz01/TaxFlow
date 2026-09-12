import { DueDateEngine } from "../src/lib/due-date-engine";

describe("DueDateEngine Statutory Rules", () => {
  it("should calculate correct ITR due date for non-audit client (31st July)", () => {
    const dueDate = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_1",
      isAuditRequired: false
    });
    expect(dueDate.getMonth()).toBe(6); // 6 = July (0-indexed)
    expect(dueDate.getDate()).toBe(31);
    expect(dueDate.getFullYear()).toBe(2026);
  });

  it("should calculate correct ITR due date for audit client (31st October)", () => {
    const dueDate = DueDateEngine.calculateItrDueDate({
      assessmentYear: "AY 2026-27",
      formType: "ITR_3",
      isAuditRequired: true
    });
    expect(dueDate.getMonth()).toBe(9); // 9 = October
    expect(dueDate.getDate()).toBe(31);
    expect(dueDate.getFullYear()).toBe(2026);
  });

  it("should calculate GSTR-3B monthly due date (20th next month)", () => {
    const dueDate = DueDateEngine.calculateGstDueDate({
      returnType: "GSTR3B",
      period: "August 2026",
      frequency: "MONTHLY",
      year: 2026
    });
    expect(dueDate.getDate()).toBe(20);
  });
});
