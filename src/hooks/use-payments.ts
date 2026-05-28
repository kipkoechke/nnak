"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentsService } from "@/services/payments.service";
import { nqk } from "@/lib/query-keys";

export const usePayments = (p: { page?: number; per_page?: number; purpose?: string; status?: string; user_id?: string } = {}) =>
  useQuery({ queryKey: nqk.payments.list(p), queryFn: () => paymentsService.list(p), placeholderData: (prev) => prev });

export const useMyPayments = (userId: string | undefined) =>
  useQuery({
    queryKey: nqk.payments.list({ user_id: userId ?? "" }),
    queryFn: () => paymentsService.listMine(userId!),
    enabled: !!userId,
  });

export const useStkPush = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsService.stkPush,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.payments.all });
      qc.invalidateQueries({ queryKey: nqk.members.all });
      qc.invalidateQueries({ queryKey: nqk.reports.kpis });
      toast.success("Payment received");
    },
    onError: () => toast.error("Payment failed"),
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsService.record,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.payments.all });
      qc.invalidateQueries({ queryKey: nqk.reports.kpis });
      toast.success("Payment recorded");
    },
  });
};
