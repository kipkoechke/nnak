"use client";
import { useMemo, useState } from "react";
import { MdCalendarToday, MdReceipt } from "react-icons/md";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#ea580c",
];

const fmtKes = (v: string | number) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtCompact = (n: number) =>
  Math.abs(n) >= 1000
    ? `${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
    : `${n}`;

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function AdminDashboard() {
  // Default range: the last 30 days.
  const [start, setStart] = useState(daysAgoIso(30));
  const [end, setEnd] = useState(todayIso());

  const params = useMemo(
    () => ({ start_date: start, end_date: end }),
    [start, end],
  );
  const { data, isLoading } = useAdminDashboard(params);

  const chapterChart = useMemo(
    () =>
      (data?.chapters ?? []).map((r) => ({
        name: r.chapter_label,
        value: r.total_members,
      })),
    [data],
  );

  const pendingMembers = data?.recent_pending_members ?? [];
  const showTrend = data?.trendline?.some(
    (t) => t.fully_paid || t.partially_paid || t.not_paid,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Date range */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <MdCalendarToday className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">From</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">To</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {isLoading && !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse h-20"
            />
          ))}
        </div>
      ) : !data ? (
        <div className="py-8 text-sm text-center text-slate-400">
          No data available for this period.
        </div>
      ) : (
        <>
          {/* Members */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Members
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Total Members" value={data.members.total} />
              <KpiCard label="Active" value={data.members.active} accent="emerald" />
              <KpiCard label="Inactive" value={data.members.inactive} accent="amber" />
              <KpiCard
                label="Pending Approval"
                value={data.members.pending_approval}
                accent="amber"
              />
              <KpiCard
                label="New This Period"
                value={data.members.new_this_period}
                accent="blue"
              />
              <KpiCard
                label="Corporate / Individual"
                value={`${data.members.corporate} / ${data.members.individual}`}
              />
            </div>
          </section>

          {/* Revenue */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KpiCard
                label="Collected (period)"
                value={fmtKes(data.revenue.collected_this_period)}
                accent="emerald"
              />
              <KpiCard
                label="Pending Invoices"
                value={data.revenue.pending_invoices}
                accent="amber"
              />
              <KpiCard
                label="Pending Amount"
                value={fmtKes(data.revenue.pending_amount)}
                accent="amber"
              />
            </div>
          </section>

          {/* Members by chapter — full width */}
          <HBarChart title="Members by Chapter" data={chapterChart} />

          {/* Payments trend */}
          {showTrend && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Payments Trend (invoices by status)
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={data.trendline}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month_label"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
                  <Line
                    type="monotone"
                    dataKey="fully_paid"
                    name="Fully paid"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="partially_paid"
                    name="Partially paid"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="not_paid"
                    name="Not paid"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <MdReceipt className="w-4 h-4" /> Batches — This Month
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Batches" value={data.batches.this_month.count} />
                <MiniStat
                  label="Paid"
                  value={data.batches.this_month.paid_count}
                  accent="emerald"
                />
                <MiniStat
                  label="Pending"
                  value={data.batches.this_month.pending_count}
                  accent="amber"
                />
              </div>
              <div className="border-t border-slate-100 mt-3 pt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat
                  label="Collected"
                  value={fmtKes(data.batches.this_month.total_collected)}
                  small
                />
                <MiniStat
                  label="Branch Share"
                  value={fmtKes(data.batches.this_month.branch_share)}
                  small
                />
                <MiniStat
                  label="HQ Share"
                  value={fmtKes(data.batches.this_month.hq_share)}
                  small
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <MdReceipt className="w-4 h-4" /> Batches — All Time
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                <MiniStat
                  label="Collected"
                  value={fmtKes(data.batches.all_time.total_collected)}
                  small
                />
                <MiniStat
                  label="Commission"
                  value={fmtKes(data.batches.all_time.total_commission)}
                  small
                />
                <MiniStat
                  label="Branch Share"
                  value={fmtKes(data.batches.all_time.total_branch_share)}
                  small
                />
                <MiniStat
                  label="HQ Share"
                  value={fmtKes(data.batches.all_time.total_hq_share)}
                  small
                />
                <MiniStat
                  label="Paid Total"
                  value={fmtKes(data.batches.all_time.paid_total)}
                  accent="emerald"
                  small
                />
                <MiniStat
                  label="Pending Total"
                  value={fmtKes(data.batches.all_time.pending_total)}
                  accent="amber"
                  small
                />
              </div>
            </div>
          </div>

          {/* Branches table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Branches
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Branch</th>
                    <th className="px-4 py-2">Employer Type</th>
                    <th className="px-4 py-2 text-right">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.branches ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        No branches.
                      </td>
                    </tr>
                  ) : (
                    data.branches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900 whitespace-nowrap">
                          {b.name}
                        </td>
                        <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                          {b.employer_type}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-900">
                          {b.members}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending members table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recent Pending Approvals
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Chapter of Interest</th>
                    <th className="px-4 py-2">Branch</th>
                    <th className="px-4 py-2">NCK Number</th>
                    <th className="px-4 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        No pending approvals.
                      </td>
                    </tr>
                  ) : (
                    pendingMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900 whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                          {m.email}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {m.profile?.member_category?.name ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {m.profile?.chapter_label ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {m.profile?.branch?.name ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                          {m.profile?.nck_number ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const KpiCard = ({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  accent?: "slate" | "emerald" | "amber" | "blue";
}) => {
  const cls = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-600",
    blue: "text-blue-700",
  }[accent];
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
};

const MiniStat = ({
  label,
  value,
  accent = "slate",
  small = false,
}: {
  label: string;
  value: string | number;
  accent?: "slate" | "emerald" | "amber";
  small?: boolean;
}) => {
  const cls = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-600",
  }[accent];
  return (
    <div>
      <div
        className={`${small ? "text-sm" : "text-lg"} font-bold ${cls}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
};

/**
 * Horizontal bar chart — used for category/chapter breakdowns where the
 * labels are long enough to overlap in a legend or on an x-axis.
 */
const HBarChart = ({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) => {
  const rows = data
    .filter((d) => Number(d.value) > 0)
    .sort((a, b) => b.value - a.value);
  const height = Math.max(160, rows.length * 34 + 24);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h3>
      {rows.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">
          No data for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#f1f5f9"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(v) => [Number(v).toLocaleString(), "Members"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
