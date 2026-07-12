"use client";
import { useState } from "react";
import { MdSearch } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useMpesaTransactions } from "@/hooks/use-mpesa-transactions";

const statusTone = (s?: string) => {
  const v = (s || "").toLowerCase();
  if (["success", "successful", "completed"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (v === "pending") return "bg-amber-50 text-amber-700";
  if (["failed", "cancelled"].includes(v)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
};

const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function MpesaTransactionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMpesaTransactions(
    {
      search: search || undefined,
      status: status || undefined,
      page,
    },
    { pollWhilePending: true },
  );

  const txns = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="M-Pesa Transactions"
        description="Daraja STK Push and C2B transactions received by the platform"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search receipt, phone, ref…"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Receipt</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                txns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">
                      {t.MpesaReceiptNumber || t.TransID || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{t.MSISDN}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {t.FirstName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      KES {Number(t.TransAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {t.BillRefNumber || t.InvoiceNumber || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {fmtTime(t.TransTime)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusTone(t.status)}`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 text-xs text-slate-500">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.last_page}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
