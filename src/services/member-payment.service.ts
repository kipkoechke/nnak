// Member invoice M-Pesa STK Push & query endpoints:
//   POST /member/invoices/{invoice_id}/mpesa/stkpush   { phone_number }
//   POST /member/invoices/{invoice_id}/mpesa/stkquery
//   POST /mpesa/c2b/register-urls                      { validation_url?, confirmation_url? }
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  C2bRegisterUrlsInput,
  C2bRegisterUrlsResponse,
  InvoiceStkPushInput,
  InvoiceStkPushResponse,
  InvoiceStkQueryResponse,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const memberPaymentService = {
  stkPush: async (
    invoiceId: string,
    body: InvoiceStkPushInput,
  ): Promise<InvoiceStkPushResponse["data"]> =>
    unwrap<InvoiceStkPushResponse["data"]>(
      nnakApi.post(`/member/invoices/${invoiceId}/mpesa/stkpush`, body),
    ),

  stkQuery: async (
    invoiceId: string,
  ): Promise<InvoiceStkQueryResponse["data"]> =>
    unwrap<InvoiceStkQueryResponse["data"]>(
      nnakApi.post(`/member/invoices/${invoiceId}/mpesa/stkquery`),
    ),

  registerC2bUrls: async (
    body: C2bRegisterUrlsInput = {},
  ): Promise<C2bRegisterUrlsResponse> =>
    nnakApi
      .post<ApiEnvelope<Record<string, unknown> & { message?: string }>>(
        "/mpesa/c2b/register-urls",
        body,
      )
      .then((r) => ({
        success: r.data.success,
        message: r.data.message ?? "",
        data: r.data.data,
      })),
};
