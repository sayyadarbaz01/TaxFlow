export function buildPaginationParams(query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page as string || "1", 10));
  const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize as string || "10", 10)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function formatPaginatedResponse<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
