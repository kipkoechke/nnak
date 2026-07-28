import type { BatchListMeta, NnakPagination } from "@/types/nnak";

/**
 * Some routes page with the standard `pagination` block, others (the batch
 * lists) only send `meta: { current_page, last_page, total }`. Normalise both
 * onto `NnakPagination` so the pages read one shape.
 */
export const normalizePagination = (
  pagination?: NnakPagination | null,
  meta?: BatchListMeta | null,
  fallbackPerPage = 15,
): NnakPagination | undefined => {
  if (pagination?.last_page) return pagination;
  if (!meta || meta.current_page == null) return undefined;
  const perPage = meta.per_page ?? fallbackPerPage;
  const current = meta.current_page;
  const total = meta.total ?? 0;
  return {
    current_page: current,
    per_page: perPage,
    total,
    last_page: meta.last_page ?? 1,
    from: total === 0 ? 0 : (current - 1) * perPage + 1,
    to: Math.min(current * perPage, total),
  };
};
