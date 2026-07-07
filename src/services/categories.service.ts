/**
 * Member categories service — real backend with demo fallback.
 *
 * Endpoints
 *   GET    /admin/member-categories            list
 *   POST   /admin/member-categories            create
 *   GET    /admin/member-categories/{category} show
 *   PUT    /admin/member-categories/{category} update
 *   DELETE /admin/member-categories/{category} delete
 *
 * Demo sessions fall back to the local mock store so the seeded personas
 * keep working without hitting the real backend.
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type { ApiEnvelope, MemberCategory, NnakPagination } from "@/types/nnak";

const BASE = "/admin/member-categories";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

interface CategoriesResponse {
  success: boolean;
  data: MemberCategory[];
  pagination?: NnakPagination;
}

export type CreateCategoryInput = Omit<
  MemberCategory,
  "id" | "created_at" | "updated_at"
>;

export const categoriesService = {
  list: async (): Promise<MemberCategory[]> => {
    if (isDemoSession()) return mockStore.listCategories();
    const r = await nnakApi.get<CategoriesResponse>(BASE);
    return r.data?.data ?? [];
  },

  get: async (id: string): Promise<MemberCategory | null> => {
    if (isDemoSession()) {
      return mockStore.listCategories().find((c) => c.id === id) ?? null;
    }
    return unwrap<MemberCategory>(nnakApi.get(`${BASE}/${id}`));
  },

  create: async (body: CreateCategoryInput): Promise<MemberCategory> => {
    if (isDemoSession()) return mockStore.createCategory(body);
    return unwrap<MemberCategory>(nnakApi.post(BASE, body));
  },

  update: async (
    id: string,
    body: Partial<MemberCategory>,
  ): Promise<MemberCategory> => {
    if (isDemoSession()) return mockStore.updateCategory(id, body);
    return unwrap<MemberCategory>(nnakApi.put(`${BASE}/${id}`, body));
  },

  remove: async (id: string): Promise<void> => {
    if (isDemoSession()) {
      mockStore.deleteCategory(id);
      return;
    }
    await nnakApi.delete(`${BASE}/${id}`);
  },
};
