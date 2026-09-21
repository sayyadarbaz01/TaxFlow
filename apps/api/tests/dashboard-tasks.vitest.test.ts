import { describe, it, expect, beforeEach } from "vitest";
import { ClientsService, memoryClients, memoryTasks } from "../src/modules/clients/clients.service";
import { TasksService } from "../src/modules/tasks/tasks.service";
import { DashboardService } from "../src/modules/dashboard/dashboard.service";
import { AuthUser } from "@ca-saas/shared-types";
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
  const a = letters[(panCounter + 2) % letters.length];
  const b = letters[(panCounter * 7) % letters.length];
  return `Y${a}${b}${letters[(panCounter * 11) % letters.length]}${n}Z`;
}

describe("Dashboard & Tasks business logic", () => {
  beforeEach(() => {
    memoryClients.length = 0;
    memoryTasks.length = 0;
    resetDbCircuit();
    DashboardService.invalidateCache();
  });

  it("TC-DASH-01: fallback summary counts active clients and workType pending", async () => {
    tripDbCircuit(60_000);

    await ClientsService.createClient(
      {
        name: "Dash ITR Client",
        pan: getUniquePan(),
        entityType: "INDIVIDUAL",
        contactPhone: "9111111111",
        workType: "ITR",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );
    await ClientsService.createClient(
      {
        name: "Dash GST Client",
        pan: getUniquePan(),
        entityType: "PROPRIETORSHIP",
        contactPhone: "9222222222",
        workType: "GST",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );
    await ClientsService.createClient(
      {
        name: "Dash Lead",
        pan: getUniquePan(),
        entityType: "INDIVIDUAL",
        contactPhone: "9333333333",
        workType: "ITR",
        status: "LEAD"
      },
      mockSuperAdmin
    );

    const summary = DashboardService.getFallbackSummary();
    expect(summary.activeClients).toBe(2);
    expect(summary.totalLeads).toBe(1);
    expect(summary.itrPending).toBeGreaterThanOrEqual(1);
    expect(summary.gstReturnsDue).toBeGreaterThanOrEqual(1);
  });

  it("TC-TASK-01: create task in memory when DB circuit open", async () => {
    tripDbCircuit(60_000);
    const client = await ClientsService.createClient(
      {
        name: "Task Client",
        pan: getUniquePan(),
        entityType: "INDIVIDUAL",
        contactPhone: "9444444444",
        workType: "ITR",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const task = await TasksService.createTask(
      "Follow up Form 16",
      client.id,
      new Date(Date.now() + 86400000).toISOString(),
      "HIGH",
      undefined,
      mockSuperAdmin
    );

    expect(task.title).toContain("Form 16");
    expect(memoryTasks.some(t => t.title.includes("Form 16"))).toBe(true);
  });

  it("TC-TASK-02: updateTaskStatus transitions TODO → IN_PROGRESS → DONE", async () => {
    tripDbCircuit(60_000);
    const client = await ClientsService.createClient(
      {
        name: "Status Task Client",
        pan: getUniquePan(),
        entityType: "INDIVIDUAL",
        contactPhone: "9555555555",
        workType: "ITR",
        status: "ACTIVE"
      },
      mockSuperAdmin
    );

    const task = await TasksService.createTask(
      "Prepare computation",
      client.id,
      new Date().toISOString(),
      "MEDIUM",
      undefined,
      mockSuperAdmin
    );

    const mid = await TasksService.updateTaskStatus(task.id, "IN_PROGRESS", mockSuperAdmin);
    expect(mid.status).toBe("IN_PROGRESS");

    const done = await TasksService.updateTaskStatus(task.id, "DONE", mockSuperAdmin);
    expect(done.status).toBe("DONE");
  });
});
