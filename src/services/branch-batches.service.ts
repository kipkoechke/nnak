// Branch monthly batches (manager view) and admin reconciliation:
//   GET  /branch/batches?period=&status=&per_page=&page=
//   GET  /branch/batches/{batch}?search=&per_page=&page=
//   GET  /admin/branch-batches?period=&branch_id=&status=&search=
//   GET  /admin/branch-batches/{batch}?search=&per_page=&page=
//   POST /admin/branch-batches/generate            queue batch generation
//   POST /admin/branch-batches/{batch}/retry       delete + regenerate
//   POST /admin/branch-batches/{batch}/payments    multipart record-payment
import { nnakApi } from "@/lib/api";
import { normalizePagination } from "@/lib/pagination";
import type {
  ApiEnvelope,
  BatchListMeta,
  BranchBatch,
  BranchBatchDetail,
  GenerateBatchesInput,
  GenerateBatchesResult,
  NnakPagination,
  RecordBatchPaymentInput,
  RetryBatchResult,
} from "@/types/nnak";

export interface BatchFilters {
  period?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AdminBatchFilters extends BatchFilters {
  branch_id?: string;
}

/** Members inside a batch are paginated independently of the batch list. */
export interface BatchDetailParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedBatches {
  data: BranchBatch[];
  pagination?: NnakPagination;
  meta?: BatchListMeta;
}

/**
 * Batch detail arrives as `data: { batch, meta }` while the list and the
 * record-payment response return the batch directly. Accept either.
 */
const pickBatch = (
  payload: (BranchBatchDetail & { batch?: BranchBatchDetail }) | null,
): BranchBatchDetail | null => payload?.batch ?? payload ?? null;

interface BatchListResponse {
  success: boolean;
  data: BranchBatch[];
  pagination?: NnakPagination;
  meta?: BatchListMeta;
}

const readList = (body?: BatchListResponse | null): PaginatedBatches => ({
  data: body?.data ?? [],
  pagination: normalizePagination(body?.pagination, body?.meta),
  meta: body?.meta,
});

export const branchBatchesService = {
  list: async (params: BatchFilters = {}): Promise<PaginatedBatches> => {
    const r = await nnakApi.get<BatchListResponse>("/branch/batches", {
      params,
    });
    return readList(r.data);
  },

  detail: async (
    id: string,
    params: BatchDetailParams = {},
  ): Promise<BranchBatchDetail | null> => {
    const r = await nnakApi.get<
      ApiEnvelope<BranchBatchDetail & { batch?: BranchBatchDetail }>
    >(`/branch/batches/${id}`, { params });
    return pickBatch(r.data?.data ?? null);
  },

  adminList: async (
    params: AdminBatchFilters = {},
  ): Promise<PaginatedBatches> => {
    const r = await nnakApi.get<BatchListResponse>("/admin/branch-batches", {
      params,
    });
    return readList(r.data);
  },

  adminDetail: async (
    id: string,
    params: BatchDetailParams = {},
  ): Promise<BranchBatchDetail | null> => {
    const r = await nnakApi.get<
      ApiEnvelope<BranchBatchDetail & { batch?: BranchBatchDetail }>
    >(`/admin/branch-batches/${id}`, { params });
    return pickBatch(r.data?.data ?? null);
  },

  /** Queue generation for a period. An empty `branch_ids` means all branches,
   *  so it is dropped rather than sent as `[]`. */
  generate: async (
    body: GenerateBatchesInput,
  ): Promise<GenerateBatchesResult | null> => {
    const r = await nnakApi.post<ApiEnvelope<GenerateBatchesResult>>(
      "/admin/branch-batches/generate",
      {
        period: body.period,
        ...(body.branch_ids?.length ? { branch_ids: body.branch_ids } : {}),
      },
    );
    return r.data?.data ?? null;
  },

  /** Deletes the batch and re-queues it. Omitting `period` reuses the
   *  batch's own period. */
  retry: async (
    batchId: string,
    period?: string,
  ): Promise<RetryBatchResult | null> => {
    const r = await nnakApi.post<ApiEnvelope<RetryBatchResult>>(
      `/admin/branch-batches/${batchId}/retry`,
      period ? { period } : {},
    );
    return r.data?.data ?? null;
  },

  /** Record a payment against a batch. Multipart for the optional file
   *  attachments. */
  recordPayment: async (batchId: string, body: RecordBatchPaymentInput) => {
    const fd = new FormData();
    fd.append("amount_paid", String(body.amount_paid));
    fd.append("payment_reference", body.payment_reference);
    fd.append("payment_method", body.payment_method);
    fd.append("paid_at", body.paid_at);
    if (body.notes) fd.append("notes", body.notes);
    (body.attachments ?? []).forEach((f) => fd.append("attachments[]", f));
    const r = await nnakApi.post<
      ApiEnvelope<BranchBatchDetail & { batch?: BranchBatchDetail }>
    >(`/admin/branch-batches/${batchId}/payments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return pickBatch(r.data?.data ?? null);
  },
};
