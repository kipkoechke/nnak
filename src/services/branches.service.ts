// GET /api/v1/branches -> { success, data: Branch[], pagination }
//
// On demo sessions, or when the API call fails (e.g. backend not yet
// deployed), we serve the seeded list from mockStore so the demo and
// admin UIs stay populated.

import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type { Branch } from "@/types/nnak";

interface BranchesResponse {
  success: boolean;
  data: Branch[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export const nnakBranchesService = {
  list: async (): Promise<Branch[]> => {
    if (isDemoSession()) return mockStore.listBranches();
    try {
      const r = await nnakApi.get<BranchesResponse>("/branches", {
        params: { per_page: 200 },
      });
      const data = r.data?.data;
      return Array.isArray(data) && data.length > 0 ? data : mockStore.listBranches();
    } catch {
      return mockStore.listBranches();
    }
  },
};
