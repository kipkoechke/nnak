// MOCK — backend endpoint TBD. Suggested contract: GET/POST/PATCH/DELETE /member-categories
import { mockStore } from "@/lib/mock-store";
import type { MemberCategory } from "@/types/nnak";

export const categoriesService = {
  list: async () => mockStore.listCategories(),
  create: async (b: Omit<MemberCategory, "id" | "created_at" | "updated_at">) =>
    mockStore.createCategory(b),
  update: async (id: string, b: Partial<MemberCategory>) =>
    mockStore.updateCategory(id, b),
  remove: async (id: string) => mockStore.deleteCategory(id),
};
