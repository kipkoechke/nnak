"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import { useMyPayments } from "@/hooks/use-payments";
import { useEvents } from "@/hooks/use-events";
import type { Payment, PaymentStatus } from "@/types/nnak";

const STATUS_TONE: Record<PaymentStatus, string> = {
  successful: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-200 text-slate-700",
};

const PURPOSE_LABEL: Record<Payment["purpose"], string> = {
  subscription: "Annual subscription",
  event: "Event registration",
  other: "Other",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function MyPaymentsPage() {
  const { data: me } = useNnakMe();
  const { data: page, isLoading } = useMyPayments(me?.id);
  const { data: eventsPage } = useEvents({ per_page: 100 });
  const [filter, setFilter] = useState<"all" | Payment["purpose"]>("all");

  const events = eventsPage?.data ?? [];
  const items = page?.data ?? [];

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((p) => p.purpose === filter)),
    [items, filter],
  );

  const totalPaid = items
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + p.amount, 0);

  const eventName = (id?: string | null) => events.find((e) => e.id === id)?.name;

  if (!me) return null;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="My Payments"
        description="A full record of every transaction on your account (FR-MP-013)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total paid (successful)" value={`KES ${totalPaid.toLocaleString()}`} />
        <Stat label="Transactions" value={items.length} />
        <Stat label="Last payment" value={items[0] ? fmtDate(items[0].paid_at) : "—"} />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Filter:</span>
        {(["all", "subscription", "event", "other"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-2.5 py-1 rounded-full border text-[11px] capitalize ${
              filter === opt
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {opt === "all" ? "All" : opt}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Purpose</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Loading payments…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No payments to show.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{fmtDate(p.paid_at)}</td>
                  <td className="px-3 py-2">
                    <div className="text-slate-900">{PURPOSE_LABEL[p.purpose]}</div>
                    {p.purpose === "event" && p.related_id && (
                      <div className="text-[11px] text-slate-500">{eventName(p.related_id) || "(event)"}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{p.reference || "—"}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{p.method}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {p.currency} {p.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.receipt_url ? (
                      <a
                        href={p.receipt_url}
                        onClick={(e) => {
                          if (p.receipt_url?.startsWith("/api/mock")) {
                            e.preventDefault();
                            alert("Receipt download is a mock until the backend is live.");
                          }
                        }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Receipt
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);
