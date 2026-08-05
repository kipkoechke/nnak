"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  membersService,
  type AdminCreateMemberInput,
  type MemberListQuery,
} from "@/services/members.service";
import { nqk } from "@/lib/query-keys";
import type { MemberStatus, NnakProfile } from "@/types/nnak";

export type MemberListParams = MemberListQuery;

export const useMembers = (
  p: MemberListParams = {},
  opts?: { enabled?: boolean },
) => {
  // Pagination is kept out of the cache key so a filter combination is one
  // cache entry rather than one-per-page-size. `page` has to stay, though —
  // TanStack Query only refetches when the key changes, so dropping it would
  // freeze the Pagination control on page 1. The server still receives both.
  const keyParams: Record<string, unknown> = { ...p };
  delete keyParams.per_page;
  return useQuery({
    queryKey: nqk.members.list(keyParams),
    queryFn: () => membersService.list(p),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled,
  });
};

export const useMember = (id: string) =>
  useQuery({
    queryKey: nqk.members.detail(id),
    queryFn: () => membersService.getById(id),
    enabled: !!id,
  });

/** Full admin detail incl. contributions + pending invoices. */
export const useMemberDetail = (id: string, opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [...nqk.members.detail(id), "full"],
    queryFn: () => membersService.getDetail(id),
    enabled: (opts?.enabled ?? true) && !!id,
  });

export const useCreateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: membersService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Member registered");
    },
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: { name?: string; email?: string; profile?: Partial<NnakProfile> } }) =>
      membersService.update(v.id, v.patch),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      qc.invalidateQueries({ queryKey: nqk.members.detail(v.id) });
      toast.success("Member updated");
    },
  });
};

export const useSetMemberStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: MemberStatus; reason?: string }) =>
      membersService.setStatus(v.id, v.status, v.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Status updated");
    },
  });
};

// ── Admin approval flow (real backend) ────────────────────────────
const apiErrMsg = (e: unknown, fb: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fb;

/** Direct admin creation — no OTP, auto-approved, no subscription raised. */
export const useCreateAdminMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCreateMemberInput) =>
      membersService.createMember(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Member created");
    },
    onError: (e) => toast.error(apiErrMsg(e, "Could not create the member")),
  });
};

export const useImportMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      file: File;
      branch_id?: string;
      member_category_code?: string;
    }) => membersService.importMembers(input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      const n = res?.imported;
      toast.success(
        typeof n === "number" ? `Imported ${n} members` : "Members imported",
      );
    },
    onError: (e) => toast.error(apiErrMsg(e, "Import failed")),
  });
};

export const useConvertStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersService.convertStudent(userId),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      qc.invalidateQueries({ queryKey: nqk.members.detail(userId) });
      toast.success("Student converted to member");
    },
    onError: (e) => toast.error(apiErrMsg(e, "Conversion failed")),
  });
};

export const usePendingMembers = (p: { page?: number; per_page?: number } = {}) =>
  useQuery({
    queryKey: nqk.members.pending(p as Record<string, unknown>),
    queryFn: () => membersService.listPending(p),
    placeholderData: (prev) => prev,
  });

export const useApproveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile_id: string) => membersService.approve(profile_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Member approved");
    },
    onError: (e) => toast.error(apiErrMsg(e, "Approve failed")),
  });
};

/**
 * Grant / revoke the executive dashboard for one member.
 *
 * `GET /admin/members/{id}` does not return `is_executive`, so refetching
 * would drop the value straight back to undefined and the switch would snap
 * off. The toggle response is authoritative, so patch it into the cached
 * detail instead of invalidating it; the list is invalidated as usual.
 */
export const useToggleExecutive = () => {
  const qc = useQueryClient();
  return useMutation({
    /** `userId` addresses the API; `detailId` is the id the open detail page
     *  is keyed by, which on this route is the profile id, not the user id. */
    mutationFn: ({ userId }: { userId: string; detailId?: string }) =>
      membersService.toggleExecutive(userId),
    onSuccess: (member, { userId, detailId }) => {
      qc.invalidateQueries({ queryKey: nqk.members.list() });
      const flag = member?.is_executive === true;
      for (const key of new Set([detailId ?? userId, userId])) {
        qc.setQueryData(
          [...nqk.members.detail(key), "full"],
          (prev: { member?: Record<string, unknown> } | null | undefined) =>
            prev?.member
              ? { ...prev, member: { ...prev.member, is_executive: flag } }
              : prev,
        );
        qc.setQueryData(
          nqk.members.detail(key),
          (prev: Record<string, unknown> | null | undefined) =>
            prev ? { ...prev, is_executive: flag } : prev,
        );
      }
      toast.success(
        member?.is_executive
          ? "Executive privileges granted"
          : "Executive privileges revoked",
      );
    },
    onError: (e) => toast.error(apiErrMsg(e, "Could not update privileges")),
  });
};

export const useRejectMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile_id: string) => membersService.reject(profile_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Member rejected");
    },
    onError: (e) => toast.error(apiErrMsg(e, "Reject failed")),
  });
};
