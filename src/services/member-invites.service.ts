// Member portal — branch invites:
//   GET  /member/invites?status=pending
//   POST /member/invites/{id}/accept
//   POST /member/invites/{id}/reject
import { nnakApi } from "@/lib/api";
import type { ApiEnvelope, BranchInvite } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const memberInvitesService = {
  list: async (params: { status?: string } = {}) => {
    const r = await nnakApi.get<ApiEnvelope<BranchInvite[]>>("/member/invites", {
      params,
    });
    return r.data?.data ?? [];
  },

  accept: (id: string) =>
    unwrap<BranchInvite>(nnakApi.post(`/member/invites/${id}/accept`)),

  reject: (id: string) =>
    unwrap<BranchInvite>(nnakApi.post(`/member/invites/${id}/reject`)),
};
