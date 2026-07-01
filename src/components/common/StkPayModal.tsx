"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useInvoiceStkPush,
  useInvoiceStkQuery,
} from "@/hooks/use-member-payments";
import { nqk } from "@/lib/query-keys";
import type { SubscriptionInvoice } from "@/types/nnak";

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// How long Safaricom keeps the STK prompt alive on the handset (~60s).
const STK_TIMEOUT_SECONDS = 60;

// Normalise any Kenyan number entry to Safaricom MSISDN form (2547XXXXXXXX /
// 2541XXXXXXXX) regardless of how it was typed: +254…, 0…, or a bare 7…/1….
const normalizeKenyaMsisdn = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
};

interface Props {
  invoice: Pick<
    SubscriptionInvoice,
    "id" | "invoice_number" | "amount" | "due_date"
  >;
  defaultPhone?: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onPaid?: () => void;
}

/** M-Pesa STK-push payment modal for a single invoice. Sends the push, then
 *  polls the query endpoint until the status resolves — no manual refresh. */
export default function StkPayModal({
  invoice,
  defaultPhone,
  title = "Pay Invoice",
  subtitle,
  onClose,
  onPaid,
}: Props) {
  const qc = useQueryClient();
  const stkPush = useInvoiceStkPush();
  const [phone, setPhone] = useState(defaultPhone || "");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(STK_TIMEOUT_SECONDS);

  const isTerminal = (s?: string | null) =>
    !!s &&
    ["successful", "success", "failed", "cancelled", "timeout"].includes(
      String(s).toLowerCase(),
    );

  const stkQuery = useInvoiceStkQuery(activeInvoiceId, {
    enabled: !!activeInvoiceId,
    refetchInterval: (data) => (isTerminal(data?.status) ? false : 3000),
  });

  const status = stkQuery.data?.status?.toLowerCase();
  const isSuccess = status === "successful" || status === "success";
  const isFailed =
    status === "failed" || status === "cancelled" || status === "timeout";
  const isWaiting = !!activeInvoiceId && !isSuccess && !isFailed;

  // Success: refresh subscription/membership caches, then close.
  useEffect(() => {
    if (!isSuccess) return;
    qc.invalidateQueries({ queryKey: nqk.subscriptions.all });
    qc.invalidateQueries({ queryKey: nqk.memberDashboard });
    qc.invalidateQueries({ queryKey: nqk.auth.me });
    const t = setTimeout(() => {
      onPaid?.();
      onClose();
    }, 1500);
    return () => clearTimeout(t);
  }, [isSuccess, qc, onPaid, onClose]);

  // Failure: surface the reason and re-enable the Pay button.
  useEffect(() => {
    if (!isFailed) return;
    setPaymentError(
      stkQuery.data?.ResultDesc ||
        stkQuery.data?.message ||
        (status === "cancelled"
          ? "You cancelled the payment on your phone."
          : status === "timeout"
            ? "The payment prompt timed out before you completed it."
            : "Payment was not completed."),
    );
    setActiveInvoiceId(null);
    stkPush.reset();
  }, [isFailed, stkQuery.data, status, stkPush]);

  // Countdown for the STK prompt.
  useEffect(() => {
    if (!activeInvoiceId) return;
    setCountdown(STK_TIMEOUT_SECONDS);
  }, [activeInvoiceId]);
  useEffect(() => {
    if (!isWaiting) return;
    const t = setInterval(() => setCountdown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isWaiting]);

  const pay = () => {
    const msisdn = normalizeKenyaMsisdn(phone || defaultPhone || "");
    if (!msisdn) return;
    setPaymentError(null);
    stkPush.mutate(
      { invoiceId: invoice.id, body: { phone_number: msisdn } },
      { onSuccess: (data) => setActiveInvoiceId(data.invoice_id) },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && (
              <div className="text-xs text-slate-500">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Invoice</span>
            <span className="font-mono font-semibold">
              {invoice.invoice_number}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-600">Amount</span>
            <span className="font-semibold">
              KES {Number(invoice.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-600">Due</span>
            <span>{fmtDate(invoice.due_date)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX or 2547XXXXXXXX"
            disabled={isWaiting}
            className="w-full h-[46px] px-3 rounded-lg border border-gray-300 bg-white text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary disabled:bg-slate-50"
          />
          {phone.trim() && (
            <p className="text-[11px] text-slate-500 mt-1">
              We&apos;ll prompt {normalizeKenyaMsisdn(phone)}
            </p>
          )}
        </div>

        <button
          onClick={pay}
          disabled={stkPush.isPending || isWaiting}
          className="w-full bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {stkPush.isPending
            ? "Sending..."
            : isWaiting
              ? "Waiting for confirmation…"
              : paymentError
                ? "Retry Payment"
                : "Pay via M-Pesa"}
        </button>

        {isWaiting && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0" />
            {countdown > 0 ? (
              <span>
                STK Push sent. Enter your M-Pesa PIN on your phone — we&apos;ll
                confirm automatically.{" "}
                <span className="font-semibold tabular-nums">({countdown}s)</span>
              </span>
            ) : (
              <span>
                Still processing — this is taking longer than usual. We&apos;ll
                update automatically once M-Pesa responds.
              </span>
            )}
          </div>
        )}

        {isSuccess && (
          <div className="text-xs rounded-md px-3 py-2 text-center font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
            Payment successful!
          </div>
        )}

        {paymentError && !activeInvoiceId && (
          <div className="text-xs rounded-md px-3 py-2 bg-red-50 border border-red-200 text-red-700">
            <div className="font-semibold mb-0.5">Payment failed</div>
            <div className="text-red-700/90">{paymentError}</div>
          </div>
        )}
      </div>
    </div>
  );
}
