import { buildPaginationParams, formatPaginatedResponse } from "../src/lib/utils";

describe("Pagination utils", () => {
  it("TC-PAGE-01: defaults to page 1 and pageSize 10", () => {
    expect(buildPaginationParams({})).toEqual({ page: 1, pageSize: 10, skip: 0 });
  });

  it("TC-PAGE-02: computes skip from page and pageSize", () => {
    expect(buildPaginationParams({ page: "3", pageSize: "20" })).toEqual({
      page: 3,
      pageSize: 20,
      skip: 40
    });
  });

  it("TC-PAGE-03: clamps pageSize to max 100", () => {
    expect(buildPaginationParams({ pageSize: "500" }).pageSize).toBe(100);
  });

  it("TC-PAGE-04: page less than 1 becomes 1", () => {
    expect(buildPaginationParams({ page: "0" }).page).toBe(1);
  });

  it("TC-PAGE-05: formatPaginatedResponse totals and pages", () => {
    const result = formatPaginatedResponse(["a", "b"], 25, 2, 10);
    expect(result).toEqual({
      data: ["a", "b"],
      total: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3
    });
  });

  it("TC-PAGE-06: zero total yields zero totalPages", () => {
    expect(formatPaginatedResponse([], 0, 1, 10).totalPages).toBe(0);
  });
});
