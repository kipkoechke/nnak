"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { memberPaymentService } from "@/services/member-payment.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { InvoiceStkPushInput } from "@/types/nnak";

export const useInvoiceStkPush = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      body,
    }: {
      invoiceId: string;
      body: InvoiceStkPushInput;
    }) => memberPaymentService.stkPush(invoiceId, body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: nqk.memberPayments.stkQuery(data.invoice_id) });
      toast.success("STK Push initiated. Check your phone for the prompt.");
    },
    onError: (e) => toast.error(extractApiError(e, "STK Push failed")),
  });
};

export const useInvoiceStkQuery = (invoiceId?: string | null) =>
  useQuery({
    queryKey: nqk.memberPayments.stkQuery(invoiceId ?? ""),
    queryFn: () => memberPaymentService.stkQuery(invoiceId!),
    enabled: false,
  });

export const useRegisterC2bUrls = () => {
  return useMutation({
    mutationFn: (body: {
      validation_url?: string;
      confirmation_url?: string;
    }) => memberPaymentService.registerC2bUrls(body),
    onSuccess: (data) =>
      toast.success(data.message || "C2B URLs registered"),
    onError: (e) => toast.error(extractApiError(e, "C2B registration failed")),
  });
};
