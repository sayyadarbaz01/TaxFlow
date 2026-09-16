import { describe, it, expect, beforeEach } from "vitest";
import { ClientsService, memoryClients, memoryTasks } from "../src/modules/clients/clients.service";
import { ClientServicesService, memoryClientServices } from "../src/modules/clients/client-services.service";
import { AuthUser, ClientDTO, ClientServiceDTO } from "@ca-saas/shared-types";

const mockSuperAdmin: AuthUser = {
  id: "test-admin-id",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

let panCounter = Math.floor(1000 + Math.random() * 8000);
function generateUniquePan(): string {
  panCounter += 1;
  const chars = "BCDEFGHJKLMNPQRSTUVWXYZ";
  const r1 = chars[Math.floor(Math.random() * chars.length)];
  const r2 = chars[Math.floor(Math.random() * chars.length)];
  return `MS${r1}${r2}${panCounter}T`;
}

describe("Lead Client & Multiple Services Per Client (7 Test Flows)", () => {
  beforeEach(() => {
    memoryClients.length = 0;
    memoryTasks.length = 0;
    memoryClientServices.length = 0;
  });

  // FLOW 1: Create Lead without PAN
  it("FLOW 1: should create a Lead Client without PAN (PAN optional)", async () => {
    const leadDto: ClientDTO = {
      name: "Rohit Verma (Prospect)",
      pan: "", // No PAN provided
      entityType: "INDIVIDUAL",
      contactPhone: "+91 98765 00001",
      contactEmail: "rohit.prospect@gmail.com",
      workType: "ITR",
      status: "LEAD"
    };

    const createdLead = await ClientsService.createClient(leadDto, mockSuperAdmin);

    expect(createdLead).toBeDefined();
    expect(createdLead.id).toBeDefined();
    expect(createdLead.name).toBe("Rohit Verma (Prospect)");
    expect(createdLead.status).toBe("LEAD");
    expect(createdLead.pan).toBeNull(); // PAN is null/optional for leads
  });

  // FLOW 2: Convert/register the client and add PAN later
  it("FLOW 2: should convert/register the lead client and allow adding PAN later", async () => {
    const leadDto: ClientDTO = {
      name: "Sunil Sharma Tech Solutions",
      entityType: "PROPRIETORSHIP",
      contactPhone: "+91 98765 00002",
      status: "LEAD"
    };

    const createdLead = await ClientsService.createClient(leadDto, mockSuperAdmin);
    expect(createdLead.status).toBe("LEAD");
    expect(createdLead.pan).toBeNull();

    // Convert lead to ACTIVE and add PAN later
    const newPan = generateUniquePan();
    const updatedClient = await ClientsService.updateClient(
      createdLead.id,
      {
        status: "ACTIVE",
        pan: newPan
      },
      mockSuperAdmin
    );

    expect(updatedClient.status).toBe("ACTIVE");
    expect(updatedClient.pan).toBe(newPan);

    // Verify fetching by ID returns updated status and PAN
    const fetched = await ClientsService.getClientById(createdLead.id, mockSuperAdmin);
    expect(fetched.status).toBe("ACTIVE");
    expect(fetched.pan).toBe(newPan);
  });

  // FLOW 3: Add Income Tax Return + select ITR form (ITR-1 through ITR-7)
  it("FLOW 3: should add Income Tax Return as a service with selectable ITR forms (ITR-1 to ITR-7)", async () => {
    const pan = generateUniquePan();
    const client = await ClientsService.createClient(
      {
        name: "Ananya Gupta",
        pan,
        entityType: "INDIVIDUAL",
        contactPhone: "+91 98765 00003",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    // Test ITR Form selection: ITR-1 through ITR-7
    const itrForms = ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"];
    for (const form of itrForms) {
      const itrServiceDto: ClientServiceDTO = {
        serviceType: "INCOME_TAX_RETURN",
        fee: 4500,
        paymentStatus: "PENDING",
        workStatus: "NOT_STARTED",
        serviceData: {
          itrFormType: form,
          assessmentYear: "AY 2026-27"
        }
      };

      const createdService = await ClientServicesService.createService(client.id, itrServiceDto, mockSuperAdmin);
      expect(createdService.serviceType).toBe("INCOME_TAX_RETURN");
      expect(createdService.serviceData?.itrFormType).toBe(form.replace("-", "_"));
      expect(createdService.serviceData?.assessmentYear).toBe("AY 2026-27");
      expect(createdService.serviceName).toContain(form);
    }
  });

  // FLOW 4 & 5 & 6 & 7: Add all 3 independent services with different fees & statuses, verify independence
  it("FLOW 4, 5, 6, 7: should maintain multiple independent services per client (ITR, GST Return, GST Registration) without overwriting", async () => {
    // 1. Create client
    const pan = generateUniquePan();
    const gstin = `27${pan}1Z5`;
    const client = await ClientsService.createClient(
      {
        name: "Apex Enterprises LLP",
        pan,
        gstin,
        entityType: "LLP",
        contactPhone: "+91 98765 00004",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    // 2. Add Service 1: Income Tax Return (ITR-5 for LLP)
    const itrDto: ClientServiceDTO = {
      serviceType: "INCOME_TAX_RETURN",
      fee: 7500,
      paymentStatus: "PAID",
      workStatus: "COMPLETED",
      serviceData: {
        itrFormType: "ITR-5",
        assessmentYear: "AY 2026-27",
        acknowledgementNo: "ACK-9988776655"
      }
    };
    const itrService = await ClientServicesService.createService(client.id, itrDto, mockSuperAdmin);

    expect(itrService.id).toBeDefined();
    expect(itrService.serviceType).toBe("INCOME_TAX_RETURN");
    expect(itrService.fee).toBe(7500);
    expect(itrService.paymentStatus).toBe("PAID");
    expect(itrService.workStatus).toBe("COMPLETED");
    expect(itrService.serviceData?.itrFormType).toBe("ITR_5");

    // 3. Add Service 2: GST Return (GSTR-3B Monthly)
    const gstReturnDto: ClientServiceDTO = {
      serviceType: "GST_RETURN",
      fee: 3000,
      paymentStatus: "PARTIAL",
      workStatus: "IN_PROGRESS",
      serviceData: {
        returnType: "GSTR3B",
        period: "August 2026"
      }
    };
    const gstReturnService = await ClientServicesService.createService(client.id, gstReturnDto, mockSuperAdmin);

    expect(gstReturnService.id).toBeDefined();
    expect(gstReturnService.id).not.toBe(itrService.id);
    expect(gstReturnService.serviceType).toBe("GST_RETURN");
    expect(gstReturnService.fee).toBe(3000);
    expect(gstReturnService.paymentStatus).toBe("PARTIAL");
    expect(gstReturnService.workStatus).toBe("IN_PROGRESS");
    expect(gstReturnService.serviceData?.returnType).toBe("GSTR3B");

    // 4. Add Service 3: GST Registration
    const gstRegDto: ClientServiceDTO = {
      serviceType: "GST_REGISTRATION",
      fee: 10000,
      paymentStatus: "PENDING",
      workStatus: "NOT_STARTED",
      serviceData: {
        registrationType: "REGULAR",
        trn: "TRN260987654321",
        state: "Maharashtra (27)"
      }
    };
    const gstRegService = await ClientServicesService.createService(client.id, gstRegDto, mockSuperAdmin);

    expect(gstRegService.id).toBeDefined();
    expect(gstRegService.id).not.toBe(itrService.id);
    expect(gstRegService.id).not.toBe(gstReturnService.id);
    expect(gstRegService.serviceType).toBe("GST_REGISTRATION");
    expect(gstRegService.fee).toBe(10000);
    expect(gstRegService.paymentStatus).toBe("PENDING");
    expect(gstRegService.workStatus).toBe("NOT_STARTED");
    expect(gstRegService.serviceData?.trn).toBe("TRN260987654321");

    // 5. Verify all three services remain independent and no existing data was overwritten
    const allServices = await ClientServicesService.listServices(client.id, mockSuperAdmin);
    expect(allServices.length).toBe(3);

    // Verify ITR service remains intact
    const foundItr = allServices.find(s => s.id === itrService.id);
    expect(foundItr).toBeDefined();
    expect(foundItr?.serviceType).toBe("INCOME_TAX_RETURN");
    expect(foundItr?.fee).toBe(7500);
    expect(foundItr?.paymentStatus).toBe("PAID");
    expect(foundItr?.workStatus).toBe("COMPLETED");
    expect(foundItr?.serviceData?.itrFormType).toBe("ITR_5");

    // Verify GST Return service remains intact
    const foundGstReturn = allServices.find(s => s.id === gstReturnService.id);
    expect(foundGstReturn).toBeDefined();
    expect(foundGstReturn?.serviceType).toBe("GST_RETURN");
    expect(foundGstReturn?.fee).toBe(3000);
    expect(foundGstReturn?.paymentStatus).toBe("PARTIAL");
    expect(foundGstReturn?.workStatus).toBe("IN_PROGRESS");
    expect(foundGstReturn?.serviceData?.period).toBe("August 2026");

    // Verify GST Registration service remains intact
    const foundGstReg = allServices.find(s => s.id === gstRegService.id);
    expect(foundGstReg).toBeDefined();
    expect(foundGstReg?.serviceType).toBe("GST_REGISTRATION");
    expect(foundGstReg?.fee).toBe(10000);
    expect(foundGstReg?.paymentStatus).toBe("PENDING");
    expect(foundGstReg?.workStatus).toBe("NOT_STARTED");
    expect(foundGstReg?.serviceData?.trn).toBe("TRN260987654321");
  });

  // FLOW: Service update & deletion independence
  it("should allow independent updating and deletion of individual services without affecting others", async () => {
    const pan = generateUniquePan();
    const client = await ClientsService.createClient(
      {
        name: "Delta Consulting Services",
        pan,
        entityType: "PVT_LTD",
        contactPhone: "+91 98765 00005",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const s1 = await ClientServicesService.createService(
      client.id,
      { serviceType: "INCOME_TAX_RETURN", fee: 5000, paymentStatus: "PENDING", workStatus: "NOT_STARTED" },
      mockSuperAdmin
    );

    const s2 = await ClientServicesService.createService(
      client.id,
      { serviceType: "GST_REGISTRATION", fee: 8000, paymentStatus: "PENDING", workStatus: "NOT_STARTED" },
      mockSuperAdmin
    );

    // Update s1 fee and payment status to PAID
    const updatedS1 = await ClientServicesService.updateService(
      client.id,
      s1.id,
      { fee: 6000, paymentStatus: "PAID", workStatus: "IN_PROGRESS" },
      mockSuperAdmin
    );
    expect(updatedS1.fee).toBe(6000);
    expect(updatedS1.paymentStatus).toBe("PAID");

    // Verify s2 was NOT affected
    const s2After = await ClientServicesService.getServiceById(client.id, s2.id, mockSuperAdmin);
    expect(s2After.fee).toBe(8000);
    expect(s2After.paymentStatus).toBe("PENDING");

    // Delete s1
    const delRes = await ClientServicesService.deleteService(client.id, s1.id, mockSuperAdmin);
    expect(delRes.success).toBe(true);

    // Verify s2 still exists
    const remaining = await ClientServicesService.listServices(client.id, mockSuperAdmin);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(s2.id);
  });

  // FLOW: Validation failure on invalid ITR form
  it("should reject invalid ITR Form with ValidationError", async () => {
    const client = await ClientsService.createClient(
      {
        name: "Test Taxpayer",
        entityType: "INDIVIDUAL",
        contactPhone: "+91 98765 00006",
        status: "LEAD"
      },
      mockSuperAdmin
    );

    await expect(
      ClientServicesService.createService(
        client.id,
        {
          serviceType: "INCOME_TAX_RETURN",
          fee: 3000,
          serviceData: { itrFormType: "ITR-99" } // Invalid Form
        },
        mockSuperAdmin
      )
    ).rejects.toThrow("Invalid ITR Form");
  });
});
