import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

test.describe("End-to-End Document Workflow & Security Verification", () => {
  const JWT_SECRET = "super-secret-access-token-key-32-chars-min";

  test("should execute complete 8-step document flow with client isolation and security", async ({ page, request }) => {
    // -------------------------------------------------------------
    // SETUP & LOGIN AS ADMIN/CA
    // -------------------------------------------------------------
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click("button:has-text('Sign In with Email')");
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // -------------------------------------------------------------
    // STEP 1: Search & Select Client by Name in Document Center
    // -------------------------------------------------------------
    await page.click('aside a[href="/documents"]');
    await expect(page).toHaveURL(/.*\/documents/);
    await expect(page.locator("h1:has-text('Client Document Vault & Checklist')")).toBeVisible();

    // Verify client select dropdown is rendered and populated
    const clientSelect = page.locator("select").first();
    await expect(clientSelect).toBeVisible();
    const apexOption = clientSelect.locator("option", { hasText: "Apex Automations" });
    await expect(apexOption).toBeAttached({ timeout: 15000 });

    // Verify search input is functional
    const searchInput = page.locator('input[placeholder*="Search Client by Name"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Apex");
    await expect(apexOption).toBeAttached({ timeout: 15000 });

    const apexOptionValue = await apexOption.getAttribute("value");
    expect(apexOptionValue).toBeTruthy();
    await clientSelect.selectOption(apexOptionValue!);

    // Verify the Active Client Profile Card appears with PAN and Contact details
    await expect(page.locator("h3:has-text('Apex Automations')").first()).toBeVisible();
    await expect(page.getByText("LEADP3646L", { exact: true })).toBeVisible();

    // -------------------------------------------------------------
    // STEP 2: Open that specific Client/User profile
    // -------------------------------------------------------------
    const openProfileBtn = page.locator("button:has-text('Open Full Client Profile')");
    await expect(openProfileBtn).toBeVisible();
    await openProfileBtn.click();

    // Verify navigation to client 360 profile
    await expect(page).toHaveURL(new RegExp(`/clients/${apexOptionValue}`));
    await expect(page.locator("h2:has-text('Apex Automations')")).toBeVisible();

    // Switch to Documents tab in the client profile
    await page.click('button:has-text("Documents")');
    await expect(page.locator("h3:has-text('Documents Linked to Apex Automations')")).toBeVisible();
    await expect(page.locator("text=Document Verification Checklist")).toBeVisible();

    // -------------------------------------------------------------
    // STEP 3 & STEP 7: Add/Upload document under that client
    // With Name, Category/Type, Upload Date, and Download/View actions
    // -------------------------------------------------------------
    await page.click("button:has-text('Add New Document')");
    await expect(page.locator("h3:has-text('Upload Document for')")).toBeVisible();

    const uniqueDocName = `Balance_Sheet_Audit_${Date.now()}`;
    await page.fill('input[placeholder*="Bank Statement Q1 2026"]', uniqueDocName);

    // Select category: FINANCIALS or PAN
    const modalCategorySelect = page.locator("form select");
    await modalCategorySelect.selectOption("PAN");

    // Upload sample file buffer
    const fileInput = page.locator('form input[type="file"]');
    await fileInput.setInputFiles({
      name: `${uniqueDocName}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 Mock PDF Content For Client Isolation Testing")
    });

    // Submit upload
    await page.click("button:has-text('Upload & Link')");

    // Wait for modal to close upon successful upload
    await expect(page.locator("h3:has-text('Upload Document for')")).not.toBeVisible({ timeout: 15000 });

    // Verify document appears in client profile table
    const docRow = page.locator("tbody tr", { hasText: uniqueDocName });
    await expect(docRow).toBeVisible({ timeout: 15000 });
    await expect(docRow.locator("span:has-text('PAN')").first()).toBeVisible();
    const viewActionLink = docRow.locator('a[title="View Document"]');
    await expect(viewActionLink).toBeVisible();
    const viewHref = await viewActionLink.getAttribute("href");
    expect(viewHref).toContain("/api/documents/");
    expect(viewHref).toContain("/view?token=");

    const downloadActionLink = docRow.locator('a[title="Download Document"]');
    await expect(downloadActionLink).toBeVisible();
    const downloadHref = await downloadActionLink.getAttribute("href");
    expect(downloadHref).toContain("/api/documents/");
    expect(downloadHref).toContain("/download?token=");

    // -------------------------------------------------------------
    // STEP 4 & STEP 8: Verify Documents are stored and linked ONLY to that Client
    // (Cross-client isolation in UI)
    // -------------------------------------------------------------
    // Return to Document Center
    await page.goto("http://localhost:3000/documents");
    await page.waitForURL(/.*\/documents/);

    // Re-select Apex Automations and confirm document is visible
    await page.locator("select").first().selectOption(apexOptionValue!);
    await expect(page.locator(`text=${uniqueDocName}`)).toBeVisible();

    // Now select a DIFFERENT client (e.g. Varun)
    const varunOptionValue = await page.locator("select").first().locator("option", { hasText: "Varun" }).getAttribute("value");
    expect(varunOptionValue).toBeTruthy();
    await page.locator("select").first().selectOption(varunOptionValue!);

    // Confirm that the document belonging to Apex does NOT appear under Varun!
    await expect(page.locator(`text=${uniqueDocName}`)).not.toBeVisible();

    // -------------------------------------------------------------
    // STEP 6: Admin/CA should see all documents grouped by Client/User
    // -------------------------------------------------------------
    await page.click("button:has-text('Grouped Overview (All Clients)')");
    await expect(page.locator("text=Firm-wide Document Repository")).toBeVisible();

    // Confirm both client cards are listed in the grouped overview
    await expect(page.locator("h4:has-text('Apex Automations')").first()).toBeVisible();
    await expect(page.locator("h4:has-text('Varun')").first()).toBeVisible();

    // Expand Apex Automations accordion card in grouped overview
    const apexGroupCard = page.locator(".cursor-pointer", { hasText: "Apex Automations" }).first();
    await apexGroupCard.click();

    // Confirm our uploaded document is nested under Apex Automations
    await expect(page.locator(`p:has-text('${uniqueDocName}')`)).toBeVisible();

    // -------------------------------------------------------------
    // STEP 5 & STEP 8: Security & Cross-Client Access Prevention
    // When a non-admin client/user logs in or requests data:
    // They must ONLY see their own documents, and be BLOCKED (HTTP 403)
    // from accessing documents belonging to any other client!
    // -------------------------------------------------------------
    // 1. Generate JWT for Client User matching Apex Automations contact email
    const apexClientToken = jwt.sign(
      {
        userId: "client-user-apex-id",
        email: "test@apexautomations.in",
        role: "Client"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. Client accesses their own documents -> 200 OK
    const ownDocsResponse = await request.get("http://localhost:5000/api/documents", {
      headers: { Authorization: `Bearer ${apexClientToken}` }
    });
    expect(ownDocsResponse.status()).toBe(200);
    const ownDocsBody = await ownDocsResponse.json();
    const ownDocFound = ownDocsBody.data.some((d: any) => d.fileName === uniqueDocName);
    expect(ownDocFound).toBe(true);

    // 3. Client attempts to access Varun's documents -> 403 Forbidden!
    const crossClientResponse = await request.get(
      `http://localhost:5000/api/documents?clientId=${varunOptionValue}`,
      {
        headers: { Authorization: `Bearer ${apexClientToken}` }
      }
    );
    expect(crossClientResponse.status()).toBe(403);
    const crossErrorBody = await crossClientResponse.json();
    expect(crossErrorBody.error?.message || crossErrorBody.message).toContain("not authorized");
    expect(crossErrorBody.error?.code).toBe("FORBIDDEN");

    // 4. Generate JWT for an unrelated 3rd-party client
    const strangerToken = jwt.sign(
      {
        userId: "stranger-client-id",
        email: "stranger@unrelatedcompany.com",
        role: "Client"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Stranger attempts to list Apex's documents -> 403 Forbidden!
    const strangerAccessResponse = await request.get(
      `http://localhost:5000/api/documents?clientId=${apexOptionValue}`,
      {
        headers: { Authorization: `Bearer ${strangerToken}` }
      }
    );
    expect(strangerAccessResponse.status()).toBe(403);

    // 6. Stranger views document by ID directly -> 403 Forbidden!
    const apexDocId = ownDocsBody.data.find((d: any) => d.fileName === uniqueDocName)?.id;
    expect(apexDocId).toBeTruthy();

    const strangerViewResponse = await request.get(
      `http://localhost:5000/api/documents/${apexDocId}/view`,
      {
        headers: { Authorization: `Bearer ${strangerToken}` }
      }
    );
    expect(strangerViewResponse.status()).toBe(403);
  });
});
