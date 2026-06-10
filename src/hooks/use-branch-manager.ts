"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { branchManagerService } from "@/services/branch-manager.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { DateRangeParams } from "@/services/admin-dashboard.service";
import type {
  BranchAddMemberInput,
  BranchVerifyMemberInput,
} from "@/types/nnak";

export const useBranchDashboard = (params?: DateRangeParams) =>
  useQuery({
    queryKey: nqk.branchDashboard(params as Record<string, unknown>),
    queryFn: () => branchManagerService.dashboard(params),
    placeholderData: (prev) => prev,
  });

export const useBranchMembers = (
  params: { page?: number; per_page?: number; search?: string } = {},
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.branchMembers(params as Record<string, unknown>),
    queryFn: () => branchManagerService.listMembers(params),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled,
  });

export const useBranchMember = (id?: string) =>
  useQuery({
    queryKey: [...nqk.branchMembers({}), "detail", id ?? ""] as const,
    queryFn: () => branchManagerService.getMemberById(id!),
    enabled: !!id,
  });

export const useAddBranchMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchAddMemberInput) => branchManagerService.addMember(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Member created — verification OTPs sent");
    },
    onError: (e) => toast.error(extractApiError(e, "Add member failed")),
  });
};

export const useVerifyBranchMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchVerifyMemberInput) =>
      branchManagerService.verifyMember(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Member verified");
    },
    onError: (e) => toast.error(extractApiError(e, "Verify failed")),
  });
};
