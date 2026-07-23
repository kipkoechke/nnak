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

/**
 * The detail endpoints answer `data: { branch|batch: {...}, meta: {...} }`,
 * while the lists and some write responses return the record directly. These
 * two helpers accept either shape so a change on one endpoint cannot silently
 * hand the pages an object of undefined fields.
 */
type Nested<K extends string, T> = T & Partial<Record<K, T>>;

/** As sent by /finance/remittances, before `remittance_type` is normalised. */
type RawRemittanceItem = Omit<FinanceRemittanceItem, "type"> & {
  type?: string;
  remittance_type?: string;
};

const pick = <K extends string, T>(
  key: K,
  payload: Nested<K, T> | null | undefined,
): T | null => (payload ? ((payload[key] as T | undefined) ?? payload) : null);

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
    const payload = await unwrap<Nested<"branch", FinanceBranchDetail>>(
      nnakApi.get(`/finance/branches/${id}`),
    );
    return pick("branch", payload);
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

  /** Detail reports counts as `renewed` / `skipped`; normalise onto the list's
   *  `processed_rows` / `skipped_count` so the shared UI reads one shape. */
  byproductDetail: async (id: string): Promise<ByProductUploadRecord | null> => {
    const raw = await unwrap<ByProductUploadRecord>(
      nnakApi.get(`/finance/byproduct/${id}`),
    );
    if (!raw) return null;
    return {
      ...raw,
      processed_rows: raw.processed_rows ?? raw.renewed,
      skipped_count: raw.skipped_count ?? raw.skipped,
    };
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
    const payload = await unwrap<Nested<"batch", FinanceBatchDetail>>(
      nnakApi.get(`/finance/batches/${id}`),
    );
    return pick("batch", payload);
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
    const r = await nnakApi.post<
      ApiEnvelope<Nested<"batch", FinanceBatchDetail>>
    >(`/finance/batches/${batchId}/payments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return pick("batch", r.data?.data ?? null);
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
    pagination?: NnakPagination;
  }> => {
    const r = await nnakApi.get<{
      success: boolean;
      pagination?: NnakPagination;
      data: {
        data: RawRemittanceItem[];
        meta?: FinanceRemittanceMeta;
        pagination?: NnakPagination;
      };
    }>("/finance/remittances", { params });
    const body = r.data?.data;
    return {
      // The API calls the discriminator `remittance_type`; every other
      // remittance shape in the app reads `type`.
      data: (body?.data ?? []).map((item) => ({
        ...item,
        type: item.type ?? item.remittance_type ?? "unknown",
      })),
      meta: body?.meta,
      // Seen both inside `data` and on the envelope, depending on the route.
      pagination: body?.pagination ?? r.data?.pagination,
    };
  },
};
