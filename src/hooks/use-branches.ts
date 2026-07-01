"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { nnakBranchesService } from "@/services/branches.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { BranchVerifyManagerInput } from "@/types/nnak";
import { useMembers } from "@/hooks/use-members";

export const useNnakBranches = (opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: nqk.branches.list(),
    queryFn: nnakBranchesService.list,
    enabled: opts?.enabled ?? true,
  });

/** Branch list for registration branch pickers — hits GET /branches (no admin
 *  scope required), unlike useNnakBranches which uses /admin/branches. */
export const useRegistrationBranches = (opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [...nqk.branches.list(), "public"] as const,
    queryFn: nnakBranchesService.listPublic,
    enabled: opts?.enabled ?? true,
  });

export const useCreateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nnakBranchesService.create,
    onError: (e) => toast.error(extractApiError(e, "Create branch failed")),
  });
};

export const useVerifyBranchManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchVerifyManagerInput) =>
      nnakBranchesService.verifyManager(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.branches.all });
      toast.success("Branch created — manager verified");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Branch manager verification failed")),
  });
};

export const useResendBranchManagerOtp = () =>
  useMutation({
    mutationFn: (body: { pending_token: string }) =>
      nnakBranchesService.resendOtp(body),
  });

export const useBranch = (id: string | undefined) =>
  useQuery({
    queryKey: nqk.branches.detail(id ?? ""),
    queryFn: () => nnakBranchesService.getById(id!),
    enabled: !!id,
  });

export const useAdminBranchMembers = (branchId: string | undefined) =>
  useMembers({ branch_id: branchId, per_page: 200 }, { enabled: !!branchId });

export const useChangeBranchManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, userId }: { branchId: string; userId: string }) =>
      nnakBranchesService.changeManager(branchId, userId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: nqk.branches.detail(vars.branchId) });
      qc.invalidateQueries({ queryKey: nqk.branches.all });
      toast.success("Branch manager changed successfully");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not change manager")),
  });
};
