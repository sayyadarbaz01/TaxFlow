import { isPracticeDataQuery, shouldUseGrounding } from "../src/modules/ai-assistant/ai.prompts";

describe("AI Tax Assistant — query classification", () => {
  it("TC-AI-01: pending ITR is practice-data query", () => {
    expect(isPracticeDataQuery("Summarize pending ITR filings.")).toBe(true);
  });

  it("TC-AI-02: GST returns due this month is practice-data", () => {
    expect(isPracticeDataQuery("Show clients with GST returns due this month.")).toBe(true);
  });

  it("TC-AI-03: missing documents is practice-data", () => {
    expect(isPracticeDataQuery("Which documents are missing?")).toBe(true);
  });

  it("TC-AI-04: compliance / risk summary is practice-data", () => {
    expect(isPracticeDataQuery("Give me a practice compliance risk summary.")).toBe(true);
  });

  it("TC-AI-05: general tax law question is NOT practice-data", () => {
    expect(isPracticeDataQuery("Explain Section 80C deductions.")).toBe(false);
  });

  it("TC-AI-06: latest deadline should use grounding", () => {
    expect(shouldUseGrounding("What's the latest GST filing deadline?")).toBe(true);
  });

  it("TC-AI-07: due date / circular / rate signals grounding", () => {
    expect(shouldUseGrounding("What is the current TDS rate under section 194C?")).toBe(true);
    expect(shouldUseGrounding("Any new CBDT circular this year?")).toBe(true);
  });

  it("TC-AI-08: simple client list does not require grounding", () => {
    expect(shouldUseGrounding("List client names in my workspace")).toBe(false);
  });
});
