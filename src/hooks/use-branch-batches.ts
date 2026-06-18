"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  branchBatchesService,
  type AdminBatchFilters,
  type BatchFilters,
} from "@/services/branch-batches.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { RecordBatchPaymentInput } from "@/types/nnak";

export const useBranchBatches = (params: BatchFilters = {}) =>
  useQuery({
    queryKey: nqk.batches.list(params as Record<string, unknown>),
    queryFn: () => branchBatchesService.list(params),
    refetchOnWindowFocus: false,
  });

export const useBranchBatch = (id?: string) =>
  useQuery({
    queryKey: nqk.batches.detail(id ?? ""),
    queryFn: () => branchBatchesService.detail(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

export const useAdminBranchBatches = (params: AdminBatchFilters = {}) =>
  useQuery({
    queryKey: nqk.batches.adminList(params as Record<string, unknown>),
    queryFn: () => branchBatchesService.adminList(params),
    refetchOnWindowFocus: false,
  });

export const useRecordBatchPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      body,
    }: {
      batchId: string;
      body: RecordBatchPaymentInput;
    }) => branchBatchesService.recordPayment(batchId, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nqk.batches.all });
      qc.invalidateQueries({ queryKey: nqk.batches.detail(vars.batchId) });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not record payment")),
  });
};
