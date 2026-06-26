"use client";
import { useState } from "react";
import { MdSearch, MdPayments } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useFinancePayments } from "@/hooks/use-finance";
import { useNnakBranches } from "@/hooks/use-branches";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtKes = (n: number) => `KES ${Number(n).toLocaleString()}`;

export default function FinancePaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useFinancePayments({
    page,
    per_page: 15,
    search: search || undefined,
    status: status || undefined,
    branch_id: branchId || undefined,
    payment_method: paymentMethod || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });
  const { data: branches = [] } = useNnakBranches();

  const payments = data?.data ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Payments"
        description="All member invoices and payment status"
      />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <SummaryCard
            label="Total Invoiced"
            value={fmtKes(summary.total_invoiced)}
          />
          <SummaryCard
            label="Collected"
            value={fmtKes(summary.total_collected)}
            accent="emerald"
          />
          <SummaryCard
            label="Pending"
            value={fmtKes(summary.pending_amount)}
            accent="amber"
            sub={`${summary.pending_count} invoices`}
          />
          <SummaryCard
            label="Collection Rate"
            value={`${summary.collection_rate.toFixed(1)}%`}
            accent="blue"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end shrink-0">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search member, invoice…"
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={paymentMethod}
          onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="check_off">Check-off</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="manual">Manual</option>
        </select>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="From"
          />
          <span className="text-slate-400 text-sm">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            placeholder="To"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-lg overflow-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <MdPayments className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No payments found.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Paid On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {p.invoice_number}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900 text-xs">
                      {p.member_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.membership_number}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-[120px] truncate">
                    {p.branch_name || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs capitalize">
                    {p.payment_method?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {fmtKes(p.amount)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-emerald-700">
                    {fmtKes(p.paid)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {p.outstanding > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        {fmtKes(p.outstanding)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_TONE[p.status] || "bg-slate-100 text-slate-600"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {fmtDate(p.due_date)}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {fmtDate(p.paid_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

const SummaryCard = ({
  label,
  value,
  sub,
  accent = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "slate" | "emerald" | "amber" | "blue";
}) => {
  const accentCls: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`text-lg font-bold mt-1 ${accentCls[accent]}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
};
