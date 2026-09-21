import { describe, it, expect, beforeEach } from "vitest";
import { TaxAuditService } from "../src/modules/tax-audit/tax-audit.service";
import { ClientsService, memoryClients, memoryTasks } from "../src/modules/clients/clients.service";
import { AuthUser } from "@ca-saas/shared-types";
import { ValidationError as ApiValidationError } from "../src/middleware/errorHandler";
import { tripDbCircuit, resetDbCircuit } from "../src/lib/db";

const mockSuperAdmin: AuthUser = {
  id: "test-admin-id",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

let panCounter = 0;
function getUniquePan(): string {
  panCounter += 1;
  const n = `${Date.now().toString().slice(-6)}${panCounter}`.padStart(4, "0").slice(-4);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[panCounter % letters.length];
  const b = letters[(panCounter * 3) % letters.length];
  return `Z${a}${b}${letters[(panCounter * 5) % letters.length]}${n}Z`;
}

describe("Tax Audit business logic", () => {
  beforeEach(() => {
    memoryClients.length = 0;
    memoryTasks.length = 0;
    resetDbCircuit();
    tripDbCircuit(60_000);
  });

  it("TC-AUDIT-01: create engagement seeds 9 Form 3CD clauses", async () => {
    const client = await ClientsService.createClient(
      {
        name: "Audit Client Pvt Ltd",
        pan: getUniquePan(),
        entityType: "PVT_LTD",
        contactPhone: "9000000001",
        workType: "Tax Audit",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const engagement = await TaxAuditService.createEngagement(
      {
        clientId: client.id,
        formType: "FORM_3CA_3CD",
        turnover: 5_00_00_000,
        cashTxnPercentage: 2.5,
        assessmentYear: "AY 2026-27"
      },
      mockSuperAdmin
    );

    expect(engagement.totalClausesCount).toBe(9);
    expect(engagement.stage).toBe("ENGAGEMENT");
    expect(engagement.isCashLimitCompliant).toBe(true);

    const clauses = await TaxAuditService.getClauses(engagement.id);
    expect(clauses).toHaveLength(9);
  });

  it("TC-AUDIT-02: cash txn > 5% marks non-compliant", async () => {
    const client = await ClientsService.createClient(
      {
        name: "Cash Heavy Firm",
        pan: getUniquePan(),
        entityType: "PROPRIETORSHIP",
        contactPhone: "9000000002",
        workType: "Tax Audit",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const engagement = await TaxAuditService.createEngagement(
      {
        clientId: client.id,
        formType: "FORM_3CB_3CD",
        turnover: 2_00_00_000,
        cashTxnPercentage: 7.5
      },
      mockSuperAdmin
    );

    expect(engagement.isCashLimitCompliant).toBe(false);
  });

  it("TC-AUDIT-03: UDIN must be exactly 18 characters", async () => {
    const client = await ClientsService.createClient(
      {
        name: "UDIN Client",
        pan: getUniquePan(),
        entityType: "LLP",
        contactPhone: "9000000003",
        workType: "Tax Audit",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const engagement = await TaxAuditService.createEngagement(
      {
        clientId: client.id,
        formType: "FORM_3CA_3CD",
        turnover: 1_00_00_000
      },
      mockSuperAdmin
    );

    await expect(
      TaxAuditService.updateStage(
        engagement.id,
        { stage: "UDIN_GENERATED", udin: "SHORT" },
        mockSuperAdmin
      )
    ).rejects.toBeInstanceOf(ApiValidationError);

    const updated = await TaxAuditService.updateStage(
      engagement.id,
      { stage: "UDIN_GENERATED", udin: "26123456AAAAAB1234" },
      mockSuperAdmin
    );
    expect(updated.udin).toBe("26123456AAAAAB1234");
    expect(updated.stage).toBe("UDIN_GENERATED");
  });

  it("TC-AUDIT-04: summary counts engagements by form and stage", async () => {
    const client = await ClientsService.createClient(
      {
        name: "Summary Audit Client",
        pan: getUniquePan(),
        entityType: "PVT_LTD",
        contactPhone: "9000000004",
        workType: "Tax Audit",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    await TaxAuditService.createEngagement(
      {
        clientId: client.id,
        formType: "FORM_3CA_3CD",
        turnover: 3_00_00_000
      },
      mockSuperAdmin
    );

    const summary = await TaxAuditService.getSummary(mockSuperAdmin);
    expect(summary.totalEngagements).toBeGreaterThanOrEqual(1);
    expect(summary.form3CA3CDCount).toBeGreaterThanOrEqual(1);
  });

  it("TC-AUDIT-05: listEngagements supports stage filter", async () => {
    const list = await TaxAuditService.listEngagements(mockSuperAdmin, {
      stage: "ENGAGEMENT",
      page: 1,
      pageSize: 50
    });
    expect(list.data.every((a: any) => a.stage === "ENGAGEMENT")).toBe(true);
  });
});
