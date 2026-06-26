"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MdPeople,
  MdCorporateFare,
  MdPayments,
  MdSwapHoriz,
  MdUpload,
  MdReceipt,
  MdCalendarToday,
  MdTrendingUp,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useFinanceDashboard } from "@/hooks/use-finance";

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const defaultRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: toISO(start), end: toISO(today) };
};

const fmtKes = (n?: number) =>
  n != null ? `KES ${Number(n).toLocaleString()}` : "—";
const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
const pct = (n?: number) => (n != null ? `${Number(n).toFixed(1)}%` : "—");

export default function FinanceDashboardPage() {
  const init = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(init.start);
  const [endDate, setEndDate] = useState(init.end);

  const { data: dash, isLoading } = useFinanceDashboard({
    start_date: startDate,
    end_date: endDate,
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-4 overflow-y-auto">
      <PageHeader
        title="Finance Dashboard"
        description="Overview of collections, remittances and branch activity"
      />

      {/* Date range */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <MdCalendarToday className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {!isLoading && dash && (
        <>
          {/* KPI row — Payments */}
          {dash.payments && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Payments
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Total Invoiced" value={fmtKes(dash.payments.total_invoiced)} />
                <KpiCard label="Total Collected" value={fmtKes(dash.payments.total_collected)} accent="emerald" />
                <KpiCard label="Pending Amount" value={fmtKes(dash.payments.pending_amount)} accent="amber" />
                <KpiCard label="Pending Invoices" value={String(dash.payments.pending_invoices)} />
                <KpiCard label="Collection Rate" value={pct(dash.payments.collection_rate)} accent={dash.payments.collection_rate >= 60 ? "emerald" : "amber"} />
              </div>
            </section>
          )}

          {/* KPI row — Members */}
          {dash.members && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Members
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Total" value={String(dash.members.total)} />
                <KpiCard label="Active" value={String(dash.members.active)} accent="emerald" />
                <KpiCard label="Inactive" value={String(dash.members.inactive)} accent="amber" />
                <KpiCard label="New this period" value={String(dash.members.new_this_period)} accent="blue" />
                <KpiCard label="Pending Approval" value={String(dash.members.pending_approval)} />
              </div>
            </section>
          )}

          {/* Remittances + Batches row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dash.remittances && (
              <section className="bg-white border border-slate-200 rounded-xl p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <MdSwapHoriz className="w-4 h-4" /> Remittances
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-[11px] text-slate-500">Total</div>
                    <div className="font-bold text-slate-900">{fmtKes(dash.remittances.total)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">M-Pesa</div>
                    <div className="font-semibold text-emerald-700">{fmtKes(dash.remittances.mpesa_collected)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Batch</div>
                    <div className="font-semibold text-blue-700">{fmtKes(dash.remittances.batch_payments)}</div>
                  </div>
                </div>
              </section>
            )}

            {dash.batches && (
              <section className="bg-white border border-slate-200 rounded-xl p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <MdReceipt className="w-4 h-4" /> Batches (This Month)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500">Count</div>
                    <div className="font-bold text-slate-900">{dash.batches.this_month.count}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Collected</div>
                    <div className="font-semibold text-slate-900">{fmtKes(dash.batches.this_month.total_collected)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">HQ Share</div>
                    <div className="font-semibold text-slate-900">{fmtKes(dash.batches.this_month.hq_share)}</div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Branches table */}
          {dash.branches && dash.branches.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MdCorporateFare className="w-4 h-4" /> Branches
                </h2>
                <Link href="/nnak/finance/branches" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Branch</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Members</th>
                      <th className="px-3 py-2 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dash.branches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{b.name}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{b.employer_type}</td>
                        <td className="px-3 py-2 text-right">{b.members}</td>
                        <td className="px-3 py-2 text-right text-xs text-slate-600">
                          {b.commission_type} · {b.commission_value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Recent Members */}
          {dash.recent_members && dash.recent_members.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MdPeople className="w-4 h-4" /> Recent Members
                </h2>
                <Link href="/nnak/finance/members" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Membership No.</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Branch</th>
                      <th className="px-3 py-2 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dash.recent_members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900">{m.name}</div>
                          <div className="text-xs text-slate-500">{m.email}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{m.membership_number}</td>
                        <td className="px-3 py-2 text-xs">{m.membership_type}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{m.branch_name || "—"}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* By-products */}
          {dash.byproducts && dash.byproducts.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MdUpload className="w-4 h-4" /> Recent By-Product Uploads
                </h2>
                <Link href="/nnak/finance/byproducts" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {dash.byproducts.map((b) => (
                  <div key={b.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="font-medium text-slate-900 truncate">{b.file_name}</div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-slate-500">{b.processed_rows}/{b.total_rows} rows</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        b.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        b.status === "processing" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{b.status}</span>
                      <span className="text-xs text-slate-400">{fmtDate(b.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary hover:shadow-sm transition-all flex items-start gap-4 group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{card.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const KpiCard = ({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "emerald" | "amber" | "blue";
}) => {
  const cls = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-600",
    blue: "text-blue-700",
  }[accent];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
};

const NAV_CARDS = [
  { href: "/nnak/finance/members", icon: MdPeople, label: "Members", description: "View all members and subscription status", color: "bg-blue-50 text-blue-600" },
  { href: "/nnak/finance/branches", icon: MdCorporateFare, label: "Branches", description: "View branch details and commissions", color: "bg-violet-50 text-violet-600" },
  { href: "/nnak/finance/batches", icon: MdReceipt, label: "Batches", description: "Reconcile monthly branch batches", color: "bg-amber-50 text-amber-600" },
  { href: "/nnak/finance/payments", icon: MdPayments, label: "Payments", description: "Track all invoices and payment status", color: "bg-emerald-50 text-emerald-600" },
  { href: "/nnak/finance/remittances", icon: MdSwapHoriz, label: "Remittances", description: "Review M-Pesa and batch remittances", color: "bg-cyan-50 text-cyan-600" },
  { href: "/nnak/finance/byproducts", icon: MdUpload, label: "By-Product", description: "Upload and track remittance files", color: "bg-slate-50 text-slate-600" },
];
