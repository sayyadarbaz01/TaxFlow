import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:5000/api";

let panCounter = Math.floor(1000 + Math.random() * 8000);
function generateUniquePan(): string {
  panCounter += 1;
  const chars = "BCDEFGHJKLMNPQRSTUVWXYZ";
  const r1 = chars[Math.floor(Math.random() * chars.length)];
  const r2 = chars[Math.floor(Math.random() * chars.length)];
  return `E2${r1}${r2}${panCounter}X`;
}

describe("End-to-End Live HTTP Business Logic Verification (Port 5000)", () => {
  let authToken = "";

  it("Step 0: Authenticate as SuperAdmin on live API", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@taxflow.com",
        password: "Pass@123"
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    authToken = body.accessToken;
  });

  let createdClientId = "";

  it("FLOW 1: Create Lead client WITHOUT PAN over live API", async () => {
    const res = await fetch(`${BASE_URL}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: "Vikram Mehta (Live Lead Test)",
        pan: "", // No PAN provided
        entityType: "INDIVIDUAL",
        contactPhone: "9876543210",
        contactEmail: "vikram.lead@gmail.com",
        workType: "ITR",
        status: "LEAD"
      })
    });

    expect(res.status).toBe(201);
    const client = await res.json();
    expect(client.id).toBeDefined();
    expect(client.name).toBe("Vikram Mehta (Live Lead Test)");
    expect(client.status).toBe("LEAD");
    expect(client.pan).toBeNull();

    createdClientId = client.id;
  });

  it("FLOW 2: Convert/register the client and add PAN later over live API", async () => {
    const newPan = generateUniquePan();

    const res = await fetch(`${BASE_URL}/clients/${createdClientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        status: "ACTIVE",
        pan: newPan
      })
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe("ACTIVE");
    expect(updated.pan).toBe(newPan);

    // Verify GET /api/clients/:id
    const getRes = await fetch(`${BASE_URL}/clients/${createdClientId}`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.status).toBe("ACTIVE");
    expect(fetched.pan).toBe(newPan);
  });

  let itrServiceId = "";
  let gstReturnServiceId = "";
  let gstRegServiceId = "";

  it("FLOW 3: Add Income Tax Return + select ITR form (ITR-1 through ITR-7)", async () => {
    const itrRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        serviceType: "INCOME_TAX_RETURN",
        fee: 6500,
        paymentStatus: "PAID",
        workStatus: "COMPLETED",
        serviceData: {
          itrFormType: "ITR_4", // Sugam Presumptive
          assessmentYear: "AY 2026-27",
          acknowledgementNo: "ACK-2026-ITR4-8899"
        }
      })
    });

    expect(itrRes.status).toBe(201);
    const itrService = await itrRes.json();
    expect(itrService.id).toBeDefined();
    expect(itrService.serviceType).toBe("INCOME_TAX_RETURN");
    expect(itrService.fee).toBe(6500);
    expect(itrService.paymentStatus).toBe("PAID");
    expect(itrService.workStatus).toBe("COMPLETED");
    expect(itrService.serviceData?.itrFormType).toBe("ITR_4");
    expect(itrService.serviceData?.assessmentYear).toBe("AY 2026-27");

    itrServiceId = itrService.id;
  });

  it("FLOW 4: Add GST Return with independent fee, payment status, and period", async () => {
    const gstRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        serviceType: "GST_RETURN",
        fee: 3500,
        paymentStatus: "PARTIAL",
        workStatus: "IN_PROGRESS",
        serviceData: {
          returnType: "GSTR3B",
          period: "August 2026"
        }
      })
    });

    expect(gstRes.status).toBe(201);
    const gstService = await gstRes.json();
    expect(gstService.id).toBeDefined();
    expect(gstService.id).not.toBe(itrServiceId);
    expect(gstService.serviceType).toBe("GST_RETURN");
    expect(gstService.fee).toBe(3500);
    expect(gstService.paymentStatus).toBe("PARTIAL");
    expect(gstService.workStatus).toBe("IN_PROGRESS");
    expect(gstService.serviceData?.returnType).toBe("GSTR3B");

    gstReturnServiceId = gstService.id;
  });

  it("FLOW 5: Add GST Registration as an independent work item", async () => {
    const regRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        serviceType: "GST_REGISTRATION",
        fee: 9000,
        paymentStatus: "PENDING",
        workStatus: "NOT_STARTED",
        serviceData: {
          registrationType: "REGULAR",
          state: "Maharashtra (27)",
          trn: "TRN2609112233"
        }
      })
    });

    expect(regRes.status).toBe(201);
    const regService = await regRes.json();
    expect(regService.id).toBeDefined();
    expect(regService.id).not.toBe(itrServiceId);
    expect(regService.id).not.toBe(gstReturnServiceId);
    expect(regService.serviceType).toBe("GST_REGISTRATION");
    expect(regService.fee).toBe(9000);
    expect(regService.paymentStatus).toBe("PENDING");
    expect(regService.workStatus).toBe("NOT_STARTED");
    expect(regService.serviceData?.trn).toBe("TRN2609112233");

    gstRegServiceId = regService.id;
  });

  it("FLOW 6 & 7: Verify all three services remain independent and no data was overwritten", async () => {
    const listRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });

    expect(listRes.status).toBe(200);
    const services = await listRes.json();
    expect(services.length).toBe(3);

    // Verify ITR Service
    const itr = services.find((s: any) => s.id === itrServiceId);
    expect(itr).toBeDefined();
    expect(itr.serviceType).toBe("INCOME_TAX_RETURN");
    expect(itr.fee).toBe(6500);
    expect(itr.paymentStatus).toBe("PAID");
    expect(itr.workStatus).toBe("COMPLETED");
    expect(itr.serviceData?.itrFormType).toBe("ITR_4");

    // Verify GST Return Service
    const gstReturn = services.find((s: any) => s.id === gstReturnServiceId);
    expect(gstReturn).toBeDefined();
    expect(gstReturn.serviceType).toBe("GST_RETURN");
    expect(gstReturn.fee).toBe(3500);
    expect(gstReturn.paymentStatus).toBe("PARTIAL");
    expect(gstReturn.workStatus).toBe("IN_PROGRESS");
    expect(gstReturn.serviceData?.returnType).toBe("GSTR3B");

    // Verify GST Registration Service
    const gstReg = services.find((s: any) => s.id === gstRegServiceId);
    expect(gstReg).toBeDefined();
    expect(gstReg.serviceType).toBe("GST_REGISTRATION");
    expect(gstReg.fee).toBe(9000);
    expect(gstReg.paymentStatus).toBe("PENDING");
    expect(gstReg.workStatus).toBe("NOT_STARTED");
    expect(gstReg.serviceData?.trn).toBe("TRN2609112233");
  });

  it("Step 8: Verify Client Dossier (GET /api/clients/:id) includes all independent services", async () => {
    const clientRes = await fetch(`${BASE_URL}/clients/${createdClientId}`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });

    expect(clientRes.status).toBe(200);
    const client = await clientRes.json();
    expect(client.services).toBeDefined();
    expect(client.services.length).toBe(3);
  });

  it("Step 9: Update a service fee & status independently without affecting others", async () => {
    const updateRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services/${gstReturnServiceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fee: 4000,
        paymentStatus: "PAID",
        workStatus: "COMPLETED"
      })
    });

    expect(updateRes.status).toBe(200);
    const updatedGst = await updateRes.json();
    expect(updatedGst.fee).toBe(4000);
    expect(updatedGst.paymentStatus).toBe("PAID");
    expect(updatedGst.workStatus).toBe("COMPLETED");

    // Verify other services were unaffected
    const checkItr = await fetch(`${BASE_URL}/clients/${createdClientId}/services/${itrServiceId}`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const itrData = await checkItr.json();
    expect(itrData.fee).toBe(6500);
    expect(itrData.paymentStatus).toBe("PAID");
  });

  it("Step 10: Delete a single service item without affecting remaining services", async () => {
    const delRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services/${gstRegServiceId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${authToken}` }
    });

    expect(delRes.status).toBe(200);

    // Verify remaining services count is now 2
    const remainingRes = await fetch(`${BASE_URL}/clients/${createdClientId}/services`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const remaining = await remainingRes.json();
    expect(remaining.length).toBe(2);
    expect(remaining.find((s: any) => s.id === gstRegServiceId)).toBeUndefined();
    expect(remaining.find((s: any) => s.id === itrServiceId)).toBeDefined();
    expect(remaining.find((s: any) => s.id === gstReturnServiceId)).toBeDefined();
  });
});
