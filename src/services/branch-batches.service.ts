// Branch monthly batches (manager view) and finance reconciliation:
//   GET  /branch/batches?period=&status=
//   GET  /branch/batches/{batch}
//   GET  /admin/branch-batches
//   POST /admin/branch-batches/{batch}    multipart record-payment
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BranchBatch,
  BranchBatchDetail,
  RecordBatchPaymentInput,
} from "@/types/nnak";

export interface BatchFilters {
  period?: string;
  status?: string;
}

export interface AdminBatchFilters extends BatchFilters {
  branch_id?: string;
}

export const branchBatchesService = {
  list: async (params: BatchFilters = {}) => {
    const r = await nnakApi.get<ApiEnvelope<BranchBatch[]>>("/branch/batches", {
      params,
    });
    return r.data?.data ?? [];
  },

  detail: async (id: string): Promise<BranchBatchDetail | null> => {
    const r = await nnakApi.get<ApiEnvelope<BranchBatchDetail>>(
      `/branch/batches/${id}`,
    );
    return r.data?.data ?? null;
  },

  adminList: async (params: AdminBatchFilters = {}) => {
    const r = await nnakApi.get<ApiEnvelope<BranchBatch[]>>(
      "/admin/branch-batches",
      { params },
    );
    return r.data?.data ?? [];
  },

  adminDetail: async (id: string): Promise<BranchBatchDetail | null> => {
    const r = await nnakApi.get<ApiEnvelope<BranchBatchDetail>>(
      `/admin/branch-batches/${id}`,
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
    const r = await nnakApi.post<ApiEnvelope<BranchBatchDetail>>(
      `/admin/branch-batches/${batchId}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return r.data?.data ?? null;
  },
};
