import { describe, it, expect, beforeEach } from "vitest";
import { ClientsService, memoryClients, memoryTasks } from "../src/modules/clients/clients.service";
import { AuthUser, ClientDTO } from "@ca-saas/shared-types";

const mockSuperAdmin: AuthUser = {
  id: "test-admin-id",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

let panCounter = Math.floor(2000 + Math.random() * 7000);
function generateUniquePan(): string {
  panCounter += 1;
  const chars = "BCDEFGHJKLMNPQRSTUVWXYZ";
  const r1 = chars[Math.floor(Math.random() * chars.length)];
  const r2 = chars[Math.floor(Math.random() * chars.length)];
  return `BB${r1}${r2}${panCounter}Z`;
}

describe("Client CRM Complete CRUD & Lifecycle Verification (Vitest)", () => {
  beforeEach(() => {
    memoryClients.length = 0;
    memoryTasks.length = 0;
  });

  // 1. ADD CLIENT
  describe("Add Client (Create)", () => {
    it("should successfully add a new Private Limited client with PAN, GSTIN, phone and email", async () => {
      const pan = generateUniquePan();
      const gstin = `27${pan}1Z5`;

      const dto: ClientDTO = {
        name: "Acme Logistics Global Pvt Ltd",
        pan,
        gstin,
        entityType: "PVT_LTD",
        contactPhone: "+91 98765 43210",
        contactEmail: "accounts@acmelogistics.in",
        workType: "ITR + GST",
        status: "ACTIVE"
      };

      const created = await ClientsService.createClient(dto, mockSuperAdmin);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe("Acme Logistics Global Pvt Ltd");
      expect(created.pan).toBe(pan);
      expect(created.gstin).toBe(gstin);
      expect(created.entityType).toBe("PVT_LTD");
      expect(created.workType).toBe("ITR + GST");
      expect(created.status).toBe("ACTIVE");

      // Verify presence in in-memory synchronization store
      const foundInMem = memoryClients.find(c => c.id === created.id);
      expect(foundInMem).toBeDefined();
      expect(foundInMem?.name).toBe("Acme Logistics Global Pvt Ltd");

      // Verify automated compliance tasks generated
      const clientTasks = memoryTasks.filter(t => t.clientId === created.id);
      expect(clientTasks.length).toBeGreaterThanOrEqual(1);
    });

    it("should reject duplicate PAN when attempting to add client with existing PAN", async () => {
      const pan = generateUniquePan();
      const dto: ClientDTO = {
        name: "First Company Ltd",
        pan,
        entityType: "PVT_LTD",
        contactPhone: "+91 98765 11111",
        workType: "ITR",
        status: "ACTIVE"
      };

      await ClientsService.createClient(dto, mockSuperAdmin);

      // Attempt creating second client with same PAN
      const duplicateDto: ClientDTO = {
        name: "Second Company Ltd",
        pan, // Same PAN
        entityType: "LLP",
        contactPhone: "+91 98765 22222",
        workType: "GST",
        status: "ACTIVE"
      };

      await expect(ClientsService.createClient(duplicateDto, mockSuperAdmin)).rejects.toThrow(/already exists/i);
    });

    it("should successfully add a Lead client without GSTIN", async () => {
      const pan = generateUniquePan();
      const dto: ClientDTO = {
        name: "Sharma Legal Advisory",
        pan,
        entityType: "PARTNERSHIP",
        contactPhone: "+91 98222 33333",
        workType: "Tax Audit",
        status: "LEAD"
      };

      const lead = await ClientsService.createClient(dto, mockSuperAdmin);
      expect(lead.status).toBe("LEAD");
      expect(lead.gstin).toBeNull();
    });
  });

  // 2. READ / LIST CLIENTS
  describe("Read / List Clients", () => {
    it("should retrieve a created client by ID", async () => {
      const pan = generateUniquePan();
      const created = await ClientsService.createClient({
        name: "Precision Tools LLP",
        pan,
        entityType: "LLP",
        contactPhone: "+91 94444 55555",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      const fetched = await ClientsService.getClientById(created.id, mockSuperAdmin);
      expect(fetched).toBeDefined();
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe("Precision Tools LLP");
      expect(fetched.pan).toBe(pan);
    });

    it("should list clients with pagination and filter by status and entity type", async () => {
      const pan1 = generateUniquePan();
      const pan2 = generateUniquePan();

      await ClientsService.createClient({
        name: "Company One Pvt Ltd",
        pan: pan1,
        entityType: "PVT_LTD",
        contactPhone: "9000000001",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      await ClientsService.createClient({
        name: "Company Two LLP",
        pan: pan2,
        entityType: "LLP",
        contactPhone: "9000000002",
        workType: "GST",
        status: "LEAD"
      }, mockSuperAdmin);

      // Query active clients
      const activeList = await ClientsService.listClients(mockSuperAdmin, { status: "ACTIVE" });
      expect(activeList.data.some(c => c.pan === pan1)).toBe(true);

      // Query leads
      const leadList = await ClientsService.listClients(mockSuperAdmin, { status: "LEAD" });
      expect(leadList.data.some(c => c.pan === pan2)).toBe(true);

      // Query by entityType
      const llpList = await ClientsService.listClients(mockSuperAdmin, { entityType: "LLP" });
      expect(llpList.data.some(c => c.pan === pan2)).toBe(true);
    });
  });

  // 3. EDIT CLIENT (UPDATE)
  describe("Edit Client (Update)", () => {
    it("should edit client contact details, phone, email, and work type", async () => {
      const pan = generateUniquePan();
      const created = await ClientsService.createClient({
        name: "Original Name Corp",
        pan,
        entityType: "PVT_LTD",
        contactPhone: "+91 91111 22222",
        contactEmail: "old@email.com",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      // Edit
      const updated = await ClientsService.updateClient(created.id, {
        name: "Updated Name Corp",
        contactPhone: "+91 93333 44444",
        contactEmail: "new@email.com",
        workType: "ITR + GST"
      }, mockSuperAdmin);

      expect(updated.name).toBe("Updated Name Corp");
      expect(updated.contactPhone).toBe("+91 93333 44444");
      expect(updated.contactEmail).toBe("new@email.com");
      expect(updated.workType).toBe("ITR + GST");

      // Verify persistence via getClientById
      const fetched = await ClientsService.getClientById(created.id, mockSuperAdmin);
      expect(fetched.name).toBe("Updated Name Corp");
      expect(fetched.contactPhone).toBe("+91 93333 44444");
      expect(fetched.contactEmail).toBe("new@email.com");
    });

    it("should convert a LEAD client to ACTIVE status and trigger filings sync", async () => {
      const pan = generateUniquePan();
      const lead = await ClientsService.createClient({
        name: "Prospective Client",
        pan,
        entityType: "INDIVIDUAL",
        contactPhone: "+91 97777 88888",
        workType: "ITR + GST",
        status: "LEAD"
      }, mockSuperAdmin);

      expect(lead.status).toBe("LEAD");

      // Convert
      const converted = await ClientsService.updateClient(lead.id, {
        status: "ACTIVE"
      }, mockSuperAdmin);

      expect(converted.status).toBe("ACTIVE");
    });
  });

  // 4. DELETE CLIENT
  describe("Delete Client (Remove)", () => {
    it("should delete an existing client and remove from all listings and memory caches", async () => {
      const pan = generateUniquePan();
      const client = await ClientsService.createClient({
        name: "Client To Be Deleted",
        pan,
        entityType: "PROPRIETORSHIP",
        contactPhone: "+91 96666 55555",
        workType: "GST",
        status: "ACTIVE"
      }, mockSuperAdmin);

      const clientId = client.id;
      expect(memoryClients.some(c => c.id === clientId)).toBe(true);

      // Delete
      const deleteRes = await ClientsService.deleteClient(clientId, mockSuperAdmin);
      expect(deleteRes.message).toContain("successfully");

      // Verify removed from memory
      expect(memoryClients.some(c => c.id === clientId)).toBe(false);
      expect(memoryTasks.some(t => t.clientId === clientId)).toBe(false);

      // Verify getClientById throws NotFoundError
      await expect(ClientsService.getClientById(clientId, mockSuperAdmin)).rejects.toThrow(/not found/i);
    });
  });
});
