"use client";
import { useQuery } from "@tanstack/react-query";
import { mpesaTransactionService } from "@/services/mpesa-transaction.service";
import { nqk } from "@/lib/query-keys";
import type { MpesaTransactionListParams } from "@/types/nnak";

export const useMpesaTransactions = (params?: MpesaTransactionListParams) =>
  useQuery({
    queryKey: nqk.mpesaTransactions.list(params ?? {}),
    queryFn: () => mpesaTransactionService.list(params),
    placeholderData: (prev) => prev,
  });
