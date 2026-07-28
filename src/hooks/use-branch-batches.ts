"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  branchBatchesService,
  type AdminBatchFilters,
  type BatchDetailParams,
  type BatchFilters,
} from "@/services/branch-batches.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type {
  GenerateBatchesInput,
  RecordBatchPaymentInput,
} from "@/types/nnak";

export const useBranchBatches = (params: BatchFilters = {}) =>
  useQuery({
    queryKey: nqk.batches.list(params as Record<string, unknown>),
    queryFn: () => branchBatchesService.list(params),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useBranchBatch = (id?: string, params: BatchDetailParams = {}) =>
  useQuery({
    queryKey: nqk.batches.detail(id ?? "", params as Record<string, unknown>),
    queryFn: () => branchBatchesService.detail(id!, params),
    enabled: !!id,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useAdminBranchBatches = (
  params: AdminBatchFilters = {},
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.batches.adminList(params as Record<string, unknown>),
    queryFn: () => branchBatchesService.adminList(params),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    enabled: opts?.enabled,
  });

export const useAdminBranchBatch = (
  id?: string,
  params: BatchDetailParams = {},
) =>
  useQuery({
    queryKey: nqk.batches.adminDetail(
      id ?? "",
      params as Record<string, unknown>,
    ),
    queryFn: () => branchBatchesService.adminDetail(id!, params),
    enabled: !!id,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

/**
 * Generation and retry are queued jobs — the response only confirms the
 * dispatch, so the lists are invalidated and the user is told to refresh
 * shortly rather than being shown a batch that does not exist yet.
 */
export const useGenerateBranchBatches = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateBatchesInput) =>
      branchBatchesService.generate(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: nqk.batches.all });
      const count = data?.branches?.length ?? 0;
      toast.success(
        count
          ? `Generation queued for ${count} branch${count === 1 ? "" : "es"}`
          : "Generation queued for all branches",
      );
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not queue batch generation")),
  });
};

export const useRetryBranchBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, period }: { batchId: string; period?: string }) =>
      branchBatchesService.retry(batchId, period),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.batches.all });
      toast.success("Batch deleted and regeneration queued");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not retry batch")),
  });
};

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.batches.all });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not record payment")),
  });
};
