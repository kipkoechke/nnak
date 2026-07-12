// Institutions
//   GET    /institutions               public list (student registration)
//   GET    /admin/institutions         admin list (paginated/searchable)
//   POST   /admin/institutions         create
//   PATCH  /admin/institutions/{id}    update
//   DELETE /admin/institutions/{id}    delete
import { nnakApi } from "@/lib/api";
import type { ApiEnvelope, Institution, NnakPagination } from "@/types/nnak";

export interface InstitutionListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  type?: string;
}

export type CreateInstitutionInput = Omit<Institution, "id" | "created_at">;

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const institutionsService = {
  list: async (
    params?: InstitutionListParams,
  ): Promise<{ data: Institution[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: Institution[];
      pagination?: NnakPagination;
    }>("/institutions", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  // ── Admin management ──────────────────────────────────────────────
  adminList: async (
    params?: InstitutionListParams,
  ): Promise<{ data: Institution[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: Institution[];
      pagination?: NnakPagination;
    }>("/admin/institutions", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: async (input: CreateInstitutionInput): Promise<Institution> =>
    unwrap<Institution>(nnakApi.post("/admin/institutions", input)),

  update: async (
    id: string,
    input: Partial<CreateInstitutionInput>,
  ): Promise<Institution> =>
    unwrap<Institution>(nnakApi.patch(`/admin/institutions/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/admin/institutions/${id}`);
  },
};
