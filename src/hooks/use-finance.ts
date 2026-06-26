"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  financeService,
  type RecordFinanceBatchPaymentInput,
} from "@/services/finance.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { ByProductUploadInput } from "@/types/nnak";

// ── Dashboard ────────────────────────────────────────────────────
export const useFinanceDashboard = (params?: {
  start_date?: string;
  end_date?: string;
}) =>
  useQuery({
    queryKey: [...nqk.finance.dashboard, params ?? {}],
    queryFn: () => financeService.dashboard(params),
    refetchOnWindowFocus: false,
    enabled: !!params?.start_date && !!params?.end_date,
  });

// ── Members ──────────────────────────────────────────────────────
export const useFinanceMembers = (
  params?: Record<string, unknown>,
) =>
  useQuery({
    queryKey: nqk.finance.members.list(params ?? {}),
    queryFn: () => financeService.members(params as Parameters<typeof financeService.members>[0]),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useFinanceMember = (id: string) =>
  useQuery({
    queryKey: nqk.finance.members.detail(id),
    queryFn: () => financeService.memberDetail(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

// ── Branches ─────────────────────────────────────────────────────
export const useFinanceBranches = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.finance.branches.list(params ?? {}),
    queryFn: () => financeService.branches(params as Parameters<typeof financeService.branches>[0]),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useFinanceBranch = (id: string) =>
  useQuery({
    queryKey: nqk.finance.branches.detail(id),
    queryFn: () => financeService.branchDetail(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

// ── By-products ───────────────────────────────────────────────────
export const useFinanceByproducts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.finance.byproducts.list(params ?? {}),
    queryFn: () =>
      financeService.byproducts(
        params as Parameters<typeof financeService.byproducts>[0],
      ),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useFinanceByproductDetail = (id: string | undefined) =>
  useQuery({
    queryKey: nqk.finance.byproducts.detail(id ?? ""),
    queryFn: () => financeService.byproductDetail(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const s = (q.state.data as { status?: string } | undefined)?.status;
      return s === "processing" || s === "queued" ? 3000 : false;
    },
  });

export const useFinanceUploadByproduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ByProductUploadInput) =>
      financeService.uploadByproduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.finance.byproducts.all });
      toast.success("By-product upload submitted");
    },
    onError: (e) => toast.error(extractApiError(e, "Upload failed")),
  });
};

export const useFinanceDownloadByproductTemplate = () =>
  useMutation({
    mutationFn: async () => {
      const blob = await financeService.byproductTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nnak-byproduct-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: (e) => toast.error(extractApiError(e, "Could not download template")),
  });

// ── Batches ───────────────────────────────────────────────────────
export const useFinanceBatches = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.finance.batches.list(params ?? {}),
    queryFn: () =>
      financeService.batches(
        params as Parameters<typeof financeService.batches>[0],
      ),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useFinanceBatch = (id: string) =>
  useQuery({
    queryKey: nqk.finance.batches.detail(id),
    queryFn: () => financeService.batchDetail(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

export const useRecordFinanceBatchPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      body,
    }: {
      batchId: string;
      body: RecordFinanceBatchPaymentInput;
    }) => financeService.recordBatchPayment(batchId, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nqk.finance.batches.all });
      qc.invalidateQueries({ queryKey: nqk.finance.batches.detail(vars.batchId) });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not record payment")),
  });
};

// ── Payments ──────────────────────────────────────────────────────
export const useFinancePayments = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.finance.payments.list(params ?? {}),
    queryFn: () =>
      financeService.payments(
        params as Parameters<typeof financeService.payments>[0],
      ),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

// ── Remittances ───────────────────────────────────────────────────
export const useFinanceRemittances = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.finance.remittances.list(params ?? {}),
    queryFn: () =>
      financeService.remittances(
        params as Parameters<typeof financeService.remittances>[0],
      ),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
