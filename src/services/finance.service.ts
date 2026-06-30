// Finance manager endpoints (/finance/*)
//   GET  /finance/dashboard
//   GET  /finance/members
//   GET  /finance/members/{id}
//   GET  /finance/branches
//   GET  /finance/branches/{id}
//   GET  /finance/byproducts
//   GET  /finance/byproduct/template
//   GET  /finance/byproduct/{upload}
//   POST /finance/byproduct/upload
//   GET  /finance/batches
//   GET  /finance/batches/{id}
//   POST /finance/batches/{id}/payments
//   GET  /finance/payments
//   GET  /finance/remittances
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  ByProductUploadInput,
  ByProductUploadRecord,
  FinanceBatch,
  FinanceBatchDetail,
  FinanceBranch,
  FinanceBranchDetail,
  FinanceDashboardData,
  FinanceMember,
  FinanceMemberDetail,
  FinancePayment,
  FinancePaymentsSummary,
  FinanceRemittanceMeta,
  FinanceRemittanceItem,
  NnakPagination,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

interface Paginated<T> {
  data: T[];
  pagination?: NnakPagination;
  meta?: Record<string, unknown>;
}

interface FinanceMembersFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  branch_id?: string;
  aging?: string;
}

interface FinanceBranchesFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

interface FinanceBatchFilters {
  page?: number;
  per_page?: number;
  period?: string;
  branch_id?: string;
  status?: string;
}

interface FinancePaymentsFilters {
  page?: number;
  per_page?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  branch_id?: string;
  payment_method?: string;
  search?: string;
}

interface FinanceRemittancesFilters {
  page?: number;
  per_page?: number;
  period?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  branch_id?: string;
}

export interface RecordFinanceBatchPaymentInput {
  amount_paid: number;
  payment_reference: string;
  payment_method: string;
  paid_at: string;
  notes?: string;
  attachments?: File[];
}

export const financeService = {
  dashboard: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FinanceDashboardData> => {
    const r = await nnakApi.get<ApiEnvelope<FinanceDashboardData>>(
      "/finance/dashboard",
      { params },
    );
    return r.data?.data ?? {};
  },

  members: async (
    params: FinanceMembersFilters = {},
  ): Promise<Paginated<FinanceMember>> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: FinanceMember[];
      pagination?: NnakPagination;
    }>("/finance/members", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  memberDetail: async (id: string): Promise<FinanceMemberDetail | null> => {
    return unwrap<FinanceMemberDetail>(nnakApi.get(`/finance/members/${id}`));
  },

  branches: async (
    params: FinanceBranchesFilters = {},
  ): Promise<Paginated<FinanceBranch>> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: FinanceBranch[];
      pagination?: NnakPagination;
    }>("/finance/branches", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  branchDetail: async (id: string): Promise<FinanceBranchDetail | null> => {
    return unwrap<FinanceBranchDetail>(nnakApi.get(`/finance/branches/${id}`));
  },

  byproducts: async (
    params?: { page?: number; per_page?: number; status?: string; branch_id?: string },
  ): Promise<Paginated<ByProductUploadRecord>> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: ByProductUploadRecord[];
      pagination?: NnakPagination;
    }>("/finance/byproducts", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  byproductTemplate: async (): Promise<Blob> => {
    const r = await nnakApi.get("/finance/byproduct/template", {
      responseType: "blob",
    });
    return r.data as Blob;
  },

  byproductDetail: async (id: string): Promise<ByProductUploadRecord | null> => {
    return unwrap<ByProductUploadRecord>(nnakApi.get(`/finance/byproduct/${id}`));
  },

  uploadByproduct: async (
    input: ByProductUploadInput,
  ): Promise<ByProductUploadRecord> => {
    const fd = new FormData();
    fd.append("file", input.file);
    fd.append("start_date", input.start_date);
    fd.append("end_date", input.end_date);
    return unwrap<ByProductUploadRecord>(
      nnakApi.post("/finance/byproduct/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  batches: async (
    params: FinanceBatchFilters = {},
  ): Promise<Paginated<FinanceBatch>> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: FinanceBatch[];
      pagination?: NnakPagination;
    }>("/finance/batches", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  batchDetail: async (id: string): Promise<FinanceBatchDetail | null> => {
    return unwrap<FinanceBatchDetail>(nnakApi.get(`/finance/batches/${id}`));
  },

  recordBatchPayment: async (
    batchId: string,
    body: RecordFinanceBatchPaymentInput,
  ): Promise<FinanceBatchDetail | null> => {
    const fd = new FormData();
    fd.append("amount_paid", String(body.amount_paid));
    fd.append("payment_reference", body.payment_reference);
    fd.append("payment_method", body.payment_method);
    fd.append("paid_at", body.paid_at);
    if (body.notes) fd.append("notes", body.notes);
    (body.attachments ?? []).forEach((f) => fd.append("attachments[]", f));
    const r = await nnakApi.post<ApiEnvelope<FinanceBatchDetail>>(
      `/finance/batches/${batchId}/payments`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return r.data?.data ?? null;
  },

  payments: async (
    params: FinancePaymentsFilters = {},
  ): Promise<{
    data: FinancePayment[];
    pagination?: NnakPagination;
    summary?: FinancePaymentsSummary;
  }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: FinancePayment[];
      pagination?: NnakPagination;
      meta?: { summary?: FinancePaymentsSummary };
    }>("/finance/payments", { params });
    return {
      data: r.data?.data ?? [],
      pagination: r.data?.pagination,
      summary: r.data?.meta?.summary,
    };
  },

  remittances: async (
    params: FinanceRemittancesFilters = {},
  ): Promise<{
    data: FinanceRemittanceItem[];
    meta?: FinanceRemittanceMeta;
  }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: {
        data: FinanceRemittanceItem[];
        meta?: FinanceRemittanceMeta;
      };
    }>("/finance/remittances", { params });
    return {
      data: r.data?.data?.data ?? [],
      meta: r.data?.data?.meta,
    };
  },
};
