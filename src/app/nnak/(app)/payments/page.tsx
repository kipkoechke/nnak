"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { usePayments } from "@/hooks/use-payments";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const { data } = usePayments({ page, per_page: 20, purpose: purpose || undefined, status: status || undefined });
  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Payments" description="Subscriptions & event collections (FR-RA-005)" />
      <div className="flex gap-2">
        <select value={purpose} onChange={(e) => { setPurpose(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All purposes</option><option value="subscription">Subscription</option><option value="event">Event</option><option value="other">Other</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="">All statuses</option>{["pending","successful","failed","refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Method</th><th className="px-3 py-2">Purpose</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.data.length === 0 && (<tr><td colSpan={6} className="p-6 text-sm text-center text-slate-500">No payments yet</td></tr>)}
            {data?.data.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 text-xs">{new Date(p.paid_at).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{p.reference}</td>
                <td className="px-3 py-2 capitalize">{p.method}</td>
                <td className="px-3 py-2 capitalize">{p.purpose}</td>
                <td className="px-3 py-2">KES {p.amount.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    p.status === "successful" ? "bg-emerald-50 text-emerald-700" :
                    p.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <Pagination
            currentPage={data.meta.current_page}
            totalPages={data.meta.last_page}
            totalItems={data.meta.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
