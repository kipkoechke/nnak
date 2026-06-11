"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useMpesaTransactions } from "@/hooks/use-mpesa-transactions";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [used, setUsed] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const { data, isLoading } = useMpesaTransactions({
    page,
    per_page: 20,
    transaction_type: transactionType || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    used: used === "" ? undefined : used === "true",
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Payments" description="Subscriptions & event collections" />
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Type</label>
          <select
            value={transactionType}
            onChange={(e) => { setTransactionType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="stk_push_callback">STK Push Callback</option>
            <option value="stk_push_request">STK Push Request</option>
            <option value="stk_query">STK Query</option>
            <option value="c2b_confirmation">C2B Confirmation</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Used</label>
          <select
            value={used}
            onChange={(e) => { setUsed(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : !data?.data.length ? (
          <div className="p-6 text-sm text-center text-slate-500">No transactions found</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Receipt</th>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 text-xs">
                      {t.TransTime ? new Date(t.TransTime).toLocaleString() : new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">{t.MSISDN}</td>
                    <td className="px-3 py-2 text-xs">{t.FirstName || "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{t.MpesaReceiptNumber}</td>
                    <td className="px-3 py-2 font-mono text-xs">{t.InvoiceNumber || "—"}</td>
                    <td className="px-3 py-2">KES {Number(t.TransAmount).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          t.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : t.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={data.meta?.current_page ?? 1}
              totalPages={data.meta?.last_page ?? 1}
              totalItems={data.meta?.total ?? data.data.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
