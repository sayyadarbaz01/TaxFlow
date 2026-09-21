import { describe, it, expect } from "vitest";
import { GstRegistrationService } from "../src/modules/gst-registration/gst-registration.service";
import { AuthUser } from "@ca-saas/shared-types";
import { ValidationError } from "../src/middleware/errorHandler";

const mockSuperAdmin: AuthUser = {
  id: "test-admin-id",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

describe("GST Registration pipeline business logic", () => {
  it("TC-GSTREG-01: create application validates PAN length 10", async () => {
    await expect(
      GstRegistrationService.createApplication(
        {
          businessName: "Bad PAN Co",
          pan: "SHORT",
          entityType: "PROPRIETORSHIP",
          contactPhone: "9876543210"
        },
        mockSuperAdmin
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("TC-GSTREG-02: create application uppercases PAN and auto-generates TRN", async () => {
    const app = await GstRegistrationService.createApplication(
      {
        businessName: "Bright Foods",
        pan: "abcde1234f",
        entityType: "PROPRIETORSHIP",
        contactPhone: "9876543210",
        registrationType: "REGULAR",
        state: "Maharashtra (27)"
      },
      mockSuperAdmin
    );

    expect(app.pan).toBe("ABCDE1234F");
    expect(app.stage).toBe("TRN_GENERATED");
    expect(app.trn).toBeTruthy();
    expect(app.trn!.startsWith("TRN")).toBe(true);
  });

  it("TC-GSTREG-03: advance stage to ARN_SUBMITTED stores ARN", async () => {
    const app = await GstRegistrationService.createApplication(
      {
        businessName: "ARN Trade",
        pan: "FGHIJ5678K",
        entityType: "PVT_LTD",
        contactPhone: "9123456780"
      },
      mockSuperAdmin
    );

    const advanced = await GstRegistrationService.advanceStage(
      app.id,
      { stage: "ARN_SUBMITTED", arn: "AA270123456789A" },
      mockSuperAdmin
    );

    expect(advanced.stage).toBe("ARN_SUBMITTED");
    expect(advanced.arn).toBe("AA270123456789A");
  });

  it("TC-GSTREG-04: summary aggregates pipeline stages", async () => {
    const summary = await GstRegistrationService.getSummary(mockSuperAdmin);
    expect(summary.totalPipeline).toBeGreaterThanOrEqual(1);
    expect(typeof summary.trnDrafts).toBe("number");
    expect(typeof summary.certificatesIssued).toBe("number");
  });

  it("TC-GSTREG-05: listApplications filters by search", async () => {
    const list = await GstRegistrationService.listApplications(mockSuperAdmin, {
      search: "Bright",
      page: 1,
      pageSize: 20
    });
    expect(list.data.some((a: any) => a.businessName.includes("Bright"))).toBe(true);
  });
});
