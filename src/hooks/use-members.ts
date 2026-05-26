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

export const useMembers = (p: MemberListParams = {}) =>
  useQuery({
    queryKey: nqk.members.list(p as Record<string, unknown>),
    queryFn: () => membersService.list(p),
    placeholderData: (prev) => prev,
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
