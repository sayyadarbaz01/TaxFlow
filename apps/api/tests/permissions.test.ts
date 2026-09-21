import { scopeToAssignedClients } from "../src/lib/permissions";
import { AuthUser } from "@ca-saas/shared-types";

const superAdmin: AuthUser = {
  id: "sa-1",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

const admin: AuthUser = {
  id: "ad-1",
  name: "Admin",
  email: "admin@taxflow.com",
  role: "Admin"
};

const staff: AuthUser = {
  id: "st-1",
  name: "Staff User",
  email: "staff@taxflow.com",
  role: "Staff"
};

describe("RBAC — scopeToAssignedClients", () => {
  it("TC-RBAC-01: SuperAdmin gets unrestricted query passthrough", () => {
    expect(scopeToAssignedClients(superAdmin, { status: "ACTIVE" })).toEqual({ status: "ACTIVE" });
  });

  it("TC-RBAC-02: Admin gets unrestricted query passthrough", () => {
    expect(scopeToAssignedClients(admin, {})).toEqual({});
  });

  it("TC-RBAC-03: Staff is scoped to contactEmail OR assignedStaffId", () => {
    const scoped = scopeToAssignedClients(staff, { status: "ACTIVE" });
    expect(scoped).toEqual({
      status: "ACTIVE",
      OR: [{ contactEmail: staff.email }, { assignedStaffId: staff.id }]
    });
  });

  it("TC-RBAC-04: empty base query still applies Staff OR filter", () => {
    const scoped = scopeToAssignedClients(staff, {});
    expect(scoped.OR).toHaveLength(2);
    expect(scoped.OR[0]).toEqual({ contactEmail: "staff@taxflow.com" });
    expect(scoped.OR[1]).toEqual({ assignedStaffId: "st-1" });
  });
});
