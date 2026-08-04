// Admin views over all branch-level invites & transfers:
//   GET  /admin/branch-invites?status=&branch_id=
//   GET  /admin/branch-transfers?status=&from_branch_id=&to_branch_id=
//   POST /admin/branch-invites/{invite}/approve
//   POST /admin/branch-transfers/{invite}/approve
//
// Both flows end with an admin: the member accepts first (status `accepted`),
// then an admin approves and the member is actually moved.
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BranchInvite,
  BranchTransfer,
} from "@/types/nnak";

export interface AdminInviteFilters {
  status?: string;
  branch_id?: string;
}

export interface AdminTransferFilters {
  status?: string;
  from_branch_id?: string;
  to_branch_id?: string;
}

export const adminInvitesService = {
  listInvites: async (params: AdminInviteFilters = {}) => {
    const r = await nnakApi.get<ApiEnvelope<BranchInvite[]>>(
      "/admin/branch-invites",
      { params },
    );
    return r.data?.data ?? [];
  },

  listTransfers: async (params: AdminTransferFilters = {}) => {
    const r = await nnakApi.get<ApiEnvelope<BranchTransfer[]>>(
      "/admin/branch-transfers",
      { params },
    );
    return r.data?.data ?? [];
  },

  /** Final admin sign-off after the member has accepted their invite. */
  approveInvite: async (inviteId: string): Promise<void> => {
    await nnakApi.post(`/admin/branch-invites/${inviteId}/approve`);
  },

  /** Final admin sign-off on a branch transfer. */
  approveTransfer: async (transferId: string): Promise<void> => {
    await nnakApi.post(`/admin/branch-transfers/${transferId}/approve`);
  },
};
