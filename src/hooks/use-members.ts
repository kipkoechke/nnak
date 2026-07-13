"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { membersService } from "@/services/members.service";
import { nqk } from "@/lib/query-keys";
import type { MemberStatus, NnakProfile } from "@/types/nnak";

export interface MemberListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category_id?: string;
  branch_id?: string;
}

export const useMembers = (p: MemberListParams = {}, opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: nqk.members.list(p as Record<string, unknown>),
    queryFn: () => membersService.list(p),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled,
  });

export const useMember = (id: string) =>
  useQuery({
    queryKey: nqk.members.detail(id),
    queryFn: () => membersService.getById(id),
    enabled: !!id,
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

export const useImportMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      file: File;
      branch_id: string;
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
