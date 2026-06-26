// GET /api/v1/branches -> { success, data: Branch[], pagination }
//
// On demo sessions, or when the API call fails (e.g. backend not yet
// deployed), we serve the seeded list from mockStore so the demo and
// admin UIs stay populated.

import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type { Branch, PendingOtpResponse } from "@/types/nnak";

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
    const r = await nnakApi.get<BranchesResponse>("/admin/branches", {
      params: { per_page: 200 },
    });
    return r.data?.data ?? [];
  },
  /** Admin: POST /admin/branches — create a branch with its primary contact.
   *  Returns a pending_token; must complete with OTP verification. */
  create: async (
    body: import("@/types/nnak").CreateBranchInput,
  ): Promise<PendingOtpResponse> => {
    const r = await nnakApi.post<{ success: boolean; data: PendingOtpResponse }>(
      "/admin/branches",
      body,
    );
    return r.data?.data;
  },

  /** Admin: POST /admin/branches/verify — verify the branch manager after
   *  branch creation. The create endpoint returns a pending_token that
   *  must be confirmed with email + phone OTPs. */
  verifyManager: async (
    body: import("@/types/nnak").BranchVerifyManagerInput,
  ): Promise<Branch> => {
    const r = await nnakApi.post<{ success: boolean; data: Branch }>(
      "/admin/branches/verify",
      body,
    );
    return r.data?.data;
  },

  /** Admin: POST /admin/branches/resend-otp — resend OTPs for pending branch. */
  resendOtp: async (body: {
    pending_token: string;
  }): Promise<PendingOtpResponse> => {
    const r = await nnakApi.post<{
      success: boolean;
      data: PendingOtpResponse;
    }>("/admin/branches/resend-otp", body);
    return r.data?.data;
  },

  /** Admin: POST /admin/branches/{branch}/change-manager */
  changeManager: async (branchId: string, userId: string): Promise<Branch> => {
    const r = await nnakApi.post<{ success: boolean; data: Branch }>(
      `/admin/branches/${branchId}/change-manager`,
      { user_id: userId },
    );
    return r.data?.data;
  },

  /** GET /admin/branches/{id} — single branch detail. */
  getById: async (id: string): Promise<Branch | null> => {
    if (isDemoSession()) {
      return mockStore.listBranches().find((b) => b.id === id) ?? null;
    }
    try {
      const r = await nnakApi.get<{ success: boolean; data: Branch }>(
        `/admin/branches/${id}`,
      );
      return r.data?.data ?? null;
    } catch {
      return null;
    }
  },
};
