// MOCK — backend endpoint TBD. Suggested contract:
//   GET  /payments
//   POST /payments/mpesa/stk-push   { user_id, amount, purpose, related_id, phone }
//   POST /payments/mpesa/callback   (server-side)
import { mockStore } from "@/lib/mock-store";
import type { Payment } from "@/types/nnak";

export const paymentsService = {
  list: async (params?: { page?: number; per_page?: number; purpose?: string; status?: string }) =>
    mockStore.listPayments(params),
  record: async (input: Omit<Payment, "id" | "created_at" | "paid_at" | "currency"> & { paid_at?: string }) =>
    mockStore.recordPayment(input),
  // simulate STK push success after small delay
  stkPush: async (input: { user_id: string; amount: number; purpose: Payment["purpose"]; related_id?: string; phone: string }) => {
    await new Promise((r) => setTimeout(r, 800));
    return mockStore.recordPayment({
      user_id: input.user_id,
      amount: input.amount,
      method: "mpesa",
      status: "successful",
      reference: "MPX" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      purpose: input.purpose,
      related_id: input.related_id ?? null,
    });
  },
};
