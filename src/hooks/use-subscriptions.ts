"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { subscriptionsService } from "@/services/subscriptions.service";
import { memberDashboardService } from "@/services/member-dashboard.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";

export const useMySubscriptions = () =>
  useQuery({
    queryKey: nqk.subscriptions.list(),
    queryFn: subscriptionsService.list,
  });

export const useMySubscription = (id: string | undefined) =>
  useQuery({
    queryKey: nqk.subscriptions.detail(id ?? ""),
    queryFn: () => subscriptionsService.getById(id!),
    enabled: !!id,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.subscriptions.all });
      qc.invalidateQueries({ queryKey: nqk.memberDashboard });
      toast.success("Subscription created — awaiting payment confirmation");
    },
    onError: (e) => toast.error(extractApiError(e, "Subscribe failed")),
  });
};

export const usePaySubscriptionBalance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      payment_method,
    }: {
      id: string;
      amount: number;
      payment_method?: string;
    }) => subscriptionsService.payBalance(id, { amount, payment_method }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.subscriptions.all });
      qc.invalidateQueries({ queryKey: nqk.memberDashboard });
      toast.success("Payment submitted successfully");
    },
    onError: (e) => toast.error(extractApiError(e, "Payment failed")),
  });
};

export const useMemberDashboardApi = () =>
  useQuery({
    queryKey: nqk.memberDashboard,
    queryFn: memberDashboardService.load,
  });
