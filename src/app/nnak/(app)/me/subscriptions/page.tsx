"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import {
  useCreateSubscription,
  useMySubscription,
  useMySubscriptions,
} from "@/hooks/use-subscriptions";
import type { MemberSubscription } from "@/types/nnak";

/**
 * Member portal — Subscriptions list & details.
 * Only calls:
 *   GET  /member/subscriptions       (useMySubscriptions)
 *   GET  /member/subscriptions/{id}  (useMySubscription)
 *   POST /member/subscriptions       (useCreateSubscription)
 */

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

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Subscriptions"
        description="Your subscription history and invoices"
      />

      <div className="flex justify-end">
        <button
          onClick={() => subscribe.mutate({})}
          disabled={subscribe.isPending}
          className="bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {subscribe.isPending ? "Submitting…" : "New Subscription"}
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Subscription details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            ×
          </button>
        </div>
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : !sub ? (
          <div className="text-sm text-slate-500">Subscription not found.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" value={sub.member_category.name} />
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
              <Field label="Payment method" value={sub.payment_method || "—"} />
            </div>

            {sub.invoice && (
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                  Invoice
                </div>
                <div className="font-medium text-slate-900">
                  {sub.invoice.invoice_number} — KES {Number(sub.invoice.amount).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  Issued {fmtDate(sub.invoice.issue_date)} · Due {fmtDate(sub.invoice.due_date)} ·{" "}
                  {sub.invoice.status ? "Paid" : "Unpaid"}
                </div>
                {sub.invoice.payments?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {sub.invoice.payments.map((p) => (
                      <li key={p.id}>
                        {fmtDate(p.paid_at)} — KES {Number(p.amount).toLocaleString()}
                        {p.method ? ` · ${p.method}` : ""}
                        {p.reference ? ` · ${p.reference}` : ""}
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
  );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-sm text-slate-900 mt-0.5">{value}</div>
  </div>
);
