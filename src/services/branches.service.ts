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
    // On a real session never fall back to the mock store, otherwise the
    // UI would let users pick a seeded UUID that the backend rejects
    // (e.g. "The selected branch id is invalid.").
    if (isDemoSession()) return mockStore.listBranches();
    const r = await nnakApi.get<BranchesResponse>("/branches", {
      params: { per_page: 200 },
    });
    return r.data?.data ?? [];
  },
  /** Admin: POST /branches — create a branch with its primary contact. */
  create: async (
    body: import("@/types/nnak").CreateBranchInput,
  ): Promise<Branch> => {
    const r = await nnakApi.post<{ success: boolean; data: Branch }>(
      "/branches",
      body,
    );
    return r.data?.data;
  },

  /** Admin: POST /branches/verify — verify the branch manager after
   *  branch creation. The create endpoint returns a pending_token that
   *  must be confirmed with email + phone OTPs. */
  verifyManager: async (
    body: import("@/types/nnak").BranchVerifyManagerInput,
  ): Promise<Branch> => {
    const r = await nnakApi.post<{ success: boolean; data: Branch }>(
      "/branches/verify",
      body,
    );
    return r.data?.data;
  },
};
