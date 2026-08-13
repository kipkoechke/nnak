"use client";
import { useQuery } from "@tanstack/react-query";
import { mpesaTransactionService } from "@/services/mpesa-transaction.service";
import { nqk } from "@/lib/query-keys";
import type { MpesaTransactionListParams } from "@/types/nnak";

export const useMpesaTransactions = (
  params?: MpesaTransactionListParams,
  opts?: {
    pollWhilePending?: boolean;
    pollIntervalMs?: number;
    /** Finance reads its own route; the key carries it so the two roles do
     *  not share a cache entry. */
    scope?: "admin" | "finance";
  },
) =>
  useQuery({
    queryKey: nqk.mpesaTransactions.list({
      ...((params ?? {}) as Record<string, unknown>),
      scope: opts?.scope ?? "admin",
    }),
    queryFn: () => mpesaTransactionService.list(params, opts?.scope ?? "admin"),
    placeholderData: (prev) => prev,
    // Autocomplete payment status: while any transaction in the current page is
    // still "pending", keep re-querying so the Daraja callback result lands
    // without a manual refresh. Stops automatically once nothing is pending.
    refetchInterval: (query) => {
      if (!opts?.pollWhilePending) return false;
      const hasPending = query.state.data?.data?.some(
        (t) => String(t.status).toLowerCase() === "pending",
      );
      return hasPending ? (opts.pollIntervalMs ?? 5000) : false;
    },
    refetchOnWindowFocus: true,
  });
