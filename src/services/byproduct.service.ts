/**
 * By-product (finance) endpoints:
 *   GET  /byproduct                    paginated list of uploads
 *   GET  /byproduct/{upload}           one upload's status / details
 *   GET  /byproduct/template           download a template (csv/xlsx)
 *   POST /byproduct/upload             multipart { file, start_date, end_date }
 *
 * Legacy demo store fallbacks (list / lines / upload as JSON lines) are
 * preserved for the existing /nnak/byproduct demo page until that UI
 * migrates to the multipart flow.
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type {
  ApiEnvelope,
  ByProductUploadInput,
  ByProductUploadRecord,
  NnakPagination,
} from "@/types/nnak";

interface ListResponse {
  success: boolean;
  data: ByProductUploadRecord[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const byProductService = {
  // ── Real API ───────────────────────────────────────────────────────
  apiList: async (params?: { page?: number; per_page?: number }) => {
    if (isDemoSession()) return { data: [], pagination: undefined };
    const r = await nnakApi.get<ListResponse>("/admin/byproduct", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },
  /** The detail endpoint reports counts as `renewed` / `skipped`, while the
   *  list uses `processed_rows` / `skipped_count`. Normalise onto the list's
   *  names so the UI reads one shape. */
  apiGet: async (id: string): Promise<ByProductUploadRecord | null> => {
    if (isDemoSession()) return null;
    const raw = await unwrap<ByProductUploadRecord>(
      nnakApi.get(`/admin/byproduct/${id}`),
    );
    if (!raw) return null;
    return {
      ...raw,
      processed_rows: raw.processed_rows ?? raw.renewed,
      skipped_count: raw.skipped_count ?? raw.skipped,
    };
  },
  /** Downloads the template — backend returns a binary stream; this
   *  resolves to a Blob the UI can save with createObjectURL. */
  apiTemplate: async (): Promise<Blob> => {
    const r = await nnakApi.get("/admin/byproduct/template", { responseType: "blob" });
    return r.data as Blob;
  },
  apiUpload: async (
    input: ByProductUploadInput,
  ): Promise<ByProductUploadRecord> => {
    const fd = new FormData();
    fd.append("file", input.file);
    fd.append("start_date", input.start_date);
    fd.append("end_date", input.end_date);
    return unwrap<ByProductUploadRecord>(
      nnakApi.post("/admin/byproduct/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  // ── Legacy demo helpers ───────────────────────────────────────────
  list: async () => mockStore.listByProductUploads(),
  lines: async (id: string) => mockStore.listByProductLines(id),
  upload: async (input: {
    branch_id: string;
    period_month: string;
    uploaded_by: string;
    lines: { national_id: string; name: string; amount: number }[];
  }) => mockStore.uploadByProduct(input),
};
