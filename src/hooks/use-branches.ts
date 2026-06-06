"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { nnakBranchesService } from "@/services/branches.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";

export const useNnakBranches = () =>
  useQuery({ queryKey: nqk.branches.list(), queryFn: nnakBranchesService.list });

export const useCreateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nnakBranchesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.branches.all });
      toast.success("Branch created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create branch failed")),
  });
};
