import { PaginatedResponse } from './pagination';

export function applyPaginationAndSort<T>(
  items: T[],
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    order?: string;
  },
): T[] | PaginatedResponse<T> {
  const result = [...items];

  if (query.sortBy) {
    const order = query.order === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = a[query.sortBy];
      const bVal = b[query.sortBy];
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
  }

  if (query.page || query.limit) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 10);
    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);

    return { data, total, page, limit };
  }

  return result;
}
