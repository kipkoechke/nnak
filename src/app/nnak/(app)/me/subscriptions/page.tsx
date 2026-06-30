"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import {
  useCreateSubscription,
  useMySubscription,
  useMySubscriptions,
  usePaySubscriptionBalance,
} from "@/hooks/use-subscriptions";
import type { MemberSubscription } from "@/types/nnak";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusTone = (paid: boolean) =>
  paid
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-800";

export default function MySubscriptionsPage() {
  const { data: subs = [], isLoading } = useMySubscriptions();
  const subscribe = useCreateSubscription();
  const [openId, setOpenId] = useState<string | null>(null);

  // If any subscription is still active, creating a new one extends (stacks)
  // the runtime onto the current expiry — so the CTA reads "Extend".
  const hasActive = subs.some(
    (s) => s.status && (!s.end_date || new Date(s.end_date).getTime() > Date.now()),
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Subscriptions"
        description="Your subscription history and invoices"
      />

      <div className="flex items-center justify-end gap-3">
        {hasActive && (
          <span className="text-[11px] text-slate-500">
            Extending adds a new term on top of your current expiry.
          </span>
        )}
        <button
          onClick={() => subscribe.mutate({})}
          disabled={subscribe.isPending}
          className="bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {subscribe.isPending
            ? "Submitting…"
            : hasActive
              ? "Extend Subscription"
              : "New Subscription"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 hidden md:table-cell">Period</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading subscriptions…
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  You don&apos;t have any subscriptions yet.
                </td>
              </tr>
            ) : (
              subs.map((s) => (
                <Row key={s.id} sub={s} onView={() => setOpenId(s.id)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {openId && (
        <DetailModal id={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

const Row = ({ sub, onView }: { sub: MemberSubscription; onView: () => void }) => (
  <tr className="hover:bg-slate-50">
    <td className="px-4 py-2 font-medium text-slate-900">
      {sub.member_category.name}
    </td>
    <td className="px-4 py-2 text-slate-600 hidden md:table-cell">
      {fmtDate(sub.start_date)} → {fmtDate(sub.end_date)}
    </td>
    <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">
      KES {Number(sub.amount).toLocaleString()}
    </td>
    <td className="px-4 py-2">
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusTone(sub.status)}`}
      >
        {sub.status ? "Active" : "Pending"}
      </span>
    </td>
    <td className="px-4 py-2 text-right">
      <button onClick={onView} className="text-xs text-primary font-medium hover:underline">
        Details
      </button>
    </td>
  </tr>
);

const DetailModal = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const { data: sub, isLoading } = useMySubscription(id);
  const [showPay, setShowPay] = useState(false);

  const invoiceAmount = Number(sub?.invoice?.amount ?? sub?.amount ?? 0);
  const totalPaid = (sub?.invoice?.payments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );
  const balance = Math.max(0, invoiceAmount - totalPaid);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Subscription details
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : !sub ? (
            <div className="text-sm text-slate-500">
              Subscription not found.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Category"
                  value={sub.member_category.name}
                />
                <Field
                  label="Amount"
                  value={`KES ${Number(sub.amount).toLocaleString()}`}
                />
                <Field label="Start" value={fmtDate(sub.start_date)} />
                <Field label="End" value={fmtDate(sub.end_date)} />
                <Field
                  label="Status"
                  value={
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusTone(sub.status)}`}
                    >
                      {sub.status ? "Active" : "Pending"}
                    </span>
                  }
                />
                <Field
                  label="Payment method"
                  value={sub.payment_method || "—"}
                />
              </div>

              {/* Balance card */}
              <div
                className={`border rounded-md p-3 ${
                  balance > 0
                    ? "border-red-200 bg-red-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Balance
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-lg font-bold ${
                      balance > 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    KES {balance.toLocaleString()}
                  </span>
                  {balance > 0 && (
                    <button
                      onClick={() => setShowPay(true)}
                      className="bg-primary text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-primary/90"
                    >
                      Pay Balance
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Invoice: KES {invoiceAmount.toLocaleString()} · Paid: KES{" "}
                  {totalPaid.toLocaleString()}
                </div>
              </div>

              {sub.invoice && (
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    Invoice
                  </div>
                  <div className="font-medium text-slate-900">
                    {sub.invoice.invoice_number} — KES{" "}
                    {Number(sub.invoice.amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    Issued {fmtDate(sub.invoice.issue_date)} · Due{" "}
                    {fmtDate(sub.invoice.due_date)} ·{" "}
                    {sub.invoice.status ? "Paid" : "Unpaid"}
                  </div>
                  {sub.invoice.payments?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {sub.invoice.payments.map((p) => (
                        <li key={p.id}>
                          {fmtDate(p.paid_at)} — KES{" "}
                          {Number(p.amount).toLocaleString()}
                          {p.payment_method
                            ? ` · ${p.payment_method}`
                            : p.method
                              ? ` · ${p.method}`
                              : ""}
                          {p.payment_reference
                            ? ` · ${p.payment_reference}`
                            : p.reference
                              ? ` · ${p.reference}`
                              : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Link
              href="/nnak/me/membership"
              className="text-xs text-primary hover:underline"
              onClick={onClose}
            >
              Manage membership →
            </Link>
          </div>
        </div>
      </div>

      {showPay && (
        <PayModal
          balance={balance}
          subscriptionId={id}
          onClose={() => setShowPay(false)}
          onPaid={onClose}
        />
      )}
    </>
  );
};

const PayModal = ({
  balance,
  subscriptionId,
  onClose,
  onPaid,
}: {
  balance: number;
  subscriptionId: string;
  onClose: () => void;
  onPaid: () => void;
}) => {
  const pay = usePaySubscriptionBalance();
  const [amount, setAmount] = useState(balance);

  const handlePay = () => {
    if (amount <= 0 || amount > balance) return;
    pay.mutate(
      { id: subscriptionId, amount },
      {
        onSuccess: () => {
          onClose();
          onPaid();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Pay Balance
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500">Outstanding Balance</div>
            <div className="text-lg font-bold text-slate-900">
              KES {balance.toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount to Pay (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.min(balance, Math.max(0, Number(e.target.value))))
              }
              max={balance}
              min={1}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={pay.isPending || amount <= 0 || amount > balance}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {pay.isPending ? "Processing…" : `Pay KES ${amount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-sm text-slate-900 mt-0.5">{value}</div>
  </div>
);
