// Branch-manager-scoped endpoints:
//   GET  /branch/dashboard?start_date&end_date
//   GET  /branch/members
//   POST /branch/members          add a member
//   POST /branch/members/verify   { pending_token, email_otp, phone_otp }
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type {
  ApiEnvelope,
  BranchAddMemberInput,
  BranchDashboardData,
  BranchVerifyMemberInput,
  NnakPagination,
  NnakProfile,
  NnakUser,
  PendingOtpResponse,
} from "@/types/nnak";
import type { DateRangeParams } from "./admin-dashboard.service";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

interface BranchMembersResponse {
  success: boolean;
  data: (NnakUser & { profile: NnakProfile | null })[];
  pagination?: NnakPagination;
}

export const branchManagerService = {
  dashboard: async (
    params?: DateRangeParams,
  ): Promise<BranchDashboardData | null> => {
    if (isDemoSession()) return null;
    try {
      return await unwrap<BranchDashboardData>(
        nnakApi.get("/branch/dashboard", { params }),
      );
    } catch {
      return null;
    }
  },

  listMembers: async (params?: { page?: number; per_page?: number; search?: string }) => {
    if (isDemoSession()) return { data: [], pagination: undefined, meta: undefined };
    const r = await nnakApi.get<BranchMembersResponse>("/branch/members", { params });
    const pagination = r.data?.pagination;
    return { data: r.data?.data ?? [], pagination, meta: pagination };
  },

  getMemberById: async (id: string) => {
    if (isDemoSession()) return null;
    try {
      return await unwrap<NnakUser & { profile: NnakProfile | null }>(
        nnakApi.get(`/branch/members/${id}`),
      );
    } catch {
      return null;
    }
  },

  /** Create a member under the manager's branch. Returns a pending_token
   *  the manager must verify via verifyMember(). */
  addMember: async (body: BranchAddMemberInput) =>
    unwrap<PendingOtpResponse & { user?: NnakUser & { profile?: NnakProfile } }>(
      nnakApi.post("/branch/members", body),
    ),

  /** Confirm email + phone OTPs to activate a manager-added member. */
  verifyMember: async (body: BranchVerifyMemberInput) =>
    unwrap<NnakUser & { profile?: NnakProfile }>(
      nnakApi.post("/branch/members/verify", body),
    ),

  /** Re-issue email + phone OTPs for a pending member verification. */
  resendMemberOtp: async (body: { pending_token: string }) =>
    unwrap<PendingOtpResponse>(
      nnakApi.post("/branch/members/resend-otp", body),
    ),
};
