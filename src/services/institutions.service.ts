// GET /institutions — public endpoint used during student registration
import { nnakApi } from "@/lib/api";
import type { ApiEnvelope, Institution, NnakPagination } from "@/types/nnak";

export const institutionsService = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    type?: string;
  }): Promise<{ data: Institution[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: Institution[];
      pagination?: NnakPagination;
    }>("/institutions", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },
};
