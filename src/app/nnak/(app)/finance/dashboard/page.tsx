"use client";
import { useMemo, useState } from "react";
import {
  MdPeople,
  MdCorporateFare,
  MdSwapHoriz,
  MdUpload,
  MdReceipt,
  MdCalendarToday,
  MdPayments,
} from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
const fmtCompact = (n: number) =>
  Math.abs(n) >= 1000
    ? `${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
    : `${n}`;
const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
const pct = (n?: number) => (n != null ? `${Number(n).toFixed(1)}%` : "—");

type PrimaryTab = "payments" | "members" | "remittances";
type DetailTab = "members" | "branches" | "byproducts";

const CHART_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

export default function FinanceDashboardPage() {
  const init = useMemo(() => defaultRange(), []);
  const [startDate, setStartDate] = useState(init.start);
  const [endDate, setEndDate] = useState(init.end);
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("payments");
  const [detailTab, setDetailTab] = useState<DetailTab>("members");

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
          {/* Primary tab bar — Payments / Members / Remittances */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-100">
              {(
                [
                  { key: "payments", label: "Payments", icon: MdPayments },
                  { key: "members", label: "Members", icon: MdPeople },
                  { key: "remittances", label: "Remittances", icon: MdSwapHoriz },
                ] as { key: PrimaryTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setPrimaryTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                    primaryTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Payments tab */}
              {primaryTab === "payments" &&
                (dash.payments ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <KpiCard label="Total Invoiced" value={fmtKes(dash.payments.total_invoiced)} />
                      <KpiCard label="Total Collected" value={fmtKes(dash.payments.total_collected)} accent="emerald" />
                      <KpiCard label="Pending Amount" value={fmtKes(dash.payments.pending_amount)} accent="amber" />
                      <KpiCard label="Pending Invoices" value={String(dash.payments.pending_invoices)} />
                      <KpiCard label="Collection Rate" value={pct(dash.payments.collection_rate)} accent={dash.payments.collection_rate >= 60 ? "emerald" : "amber"} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <StatBarChart
                        title="Invoiced vs Collected vs Pending"
                        money
                        data={[
                          { name: "Invoiced", value: dash.payments.total_invoiced },
                          { name: "Collected", value: dash.payments.total_collected },
                          { name: "Pending", value: dash.payments.pending_amount },
                        ]}
                      />
                      {dash.pending_payments_aging && (
                        <StatBarChart
                          title="Pending Payments — Aging"
                          money
                          data={Object.entries(dash.pending_payments_aging.buckets).map(
                            ([name, value]) => ({ name, value: Number(value) }),
                          )}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-sm text-center text-slate-400">No payment data.</div>
                ))}

              {/* Members tab */}
              {primaryTab === "members" &&
                (dash.members ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <KpiCard label="Total" value={String(dash.members.total)} />
                      <KpiCard label="Active" value={String(dash.members.active)} accent="emerald" />
                      <KpiCard label="Inactive" value={String(dash.members.inactive)} accent="amber" />
                      <KpiCard label="New this period" value={String(dash.members.new_this_period)} accent="blue" />
                      <KpiCard label="Pending Approval" value={String(dash.members.pending_approval)} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <StatBarChart
                        title="Membership Status"
                        data={[
                          { name: "Active", value: dash.members.active },
                          { name: "Inactive", value: dash.members.inactive },
                          { name: "Pending", value: dash.members.pending_approval },
                          { name: "New", value: dash.members.new_this_period },
                        ]}
                      />
                      <StatBarChart
                        title="Corporate vs Individual"
                        data={[
                          { name: "Corporate", value: dash.members.corporate },
                          { name: "Individual", value: dash.members.individual },
                        ]}
                      />
                    </div>
                    {dash.members.aging && (
                      <StatBarChart
                        title="Members — Aging"
                        data={Object.entries(dash.members.aging).map(([name, value]) => ({
                          name,
                          value: Number(value),
                        }))}
                      />
                    )}
                  </>
                ) : (
                  <div className="py-8 text-sm text-center text-slate-400">No member data.</div>
                ))}

              {/* Remittances tab */}
              {primaryTab === "remittances" &&
                (dash.remittances ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <KpiCard label="Total" value={fmtKes(dash.remittances.total)} />
                      <KpiCard label="M-Pesa Collected" value={fmtKes(dash.remittances.mpesa_collected)} accent="emerald" />
                      <KpiCard label="Batch Payments" value={fmtKes(dash.remittances.batch_payments)} accent="blue" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <StatBarChart
                        title="M-Pesa vs Batch"
                        money
                        data={[
                          { name: "M-Pesa", value: dash.remittances.mpesa_collected },
                          { name: "Batch", value: dash.remittances.batch_payments },
                        ]}
                      />
                      {dash.remittances.by_category && dash.remittances.by_category.length > 0 && (
                        <StatBarChart
                          title="Remittances by Category"
                          money
                          data={dash.remittances.by_category.map((c) => ({
                            name: c.label || c.category,
                            value: Number(c.amount),
                          }))}
                        />
                      )}
                    </div>
                    {dash.batches && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                          <MdReceipt className="w-4 h-4" /> Batches (This Month)
                        </h3>
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
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-sm text-center text-slate-400">No remittance data.</div>
                ))}
            </div>
          </section>

          {/* Detail tab bar */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-100">
              {(
                [
                  { key: "members", label: "Recent Members", icon: MdPeople },
                  { key: "branches", label: "Branches", icon: MdCorporateFare },
                  { key: "byproducts", label: "By-Product Uploads", icon: MdUpload },
                ] as { key: DetailTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDetailTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                    detailTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {detailTab === "members" && (
              dash.recent_members && dash.recent_members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-135">
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
              ) : (
                <div className="px-4 py-8 text-sm text-center text-slate-400">No recent members.</div>
              )
            )}

            {detailTab === "branches" && (
              dash.branches && dash.branches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-120">
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
              ) : (
                <div className="px-4 py-8 text-sm text-center text-slate-400">No branch data.</div>
              )
            )}

            {detailTab === "byproducts" && (
              dash.byproducts && dash.byproducts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {dash.byproducts.map((b) => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between text-sm">
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
              ) : (
                <div className="px-4 py-8 text-sm text-center text-slate-400">No uploads yet.</div>
              )
            )}
          </section>
        </>
      )}
    </div>
  );
}

const StatBarChart = ({
  title,
  data,
  money = false,
}: {
  title: string;
  data: { name: string; value: number }[];
  money?: boolean;
}) => {
  const hasData = data.some((d) => Number(d.value) > 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      {!hasData ? (
        <div className="h-56 flex items-center justify-center text-sm text-slate-400">
          No data for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => (money ? fmtCompact(v) : String(v))}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(v) => {
                const n = Number(v);
                return [money ? fmtKes(n) : n.toLocaleString(), ""];
              }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

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
