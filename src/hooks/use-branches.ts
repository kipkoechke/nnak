"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { nnakBranchesService } from "@/services/branches.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { BranchVerifyManagerInput } from "@/types/nnak";

export const useNnakBranches = () =>
  useQuery({
    queryKey: nqk.branches.list(),
    queryFn: nnakBranchesService.list,
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
