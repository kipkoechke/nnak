"use client";
import { useMemo, useState } from "react";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import {
  PieChart,
  Pie,
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

const DONUT_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

const fmtKes = (v: string | number) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const Kpi = ({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "ok";
}) => (
  <div
    className={`bg-white rounded-lg border p-4 ${
      tone === "warn"
        ? "border-amber-200"
        : tone === "danger"
          ? "border-red-200"
          : tone === "ok"
            ? "border-emerald-200"
            : "border-slate-200"
    }`}
  >
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
  </div>
);

const DonutCard = ({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
      {title}
    </div>
    {data.length === 0 ? (
      <p className="text-sm text-slate-400 py-4 text-center">
        No data available.
      </p>
    ) : (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>
);

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

  const categoryChart = useMemo(
    () =>
      (data?.categories ?? [])
        .filter((r) => r.category && r.category !== "None")
        .map((r) => ({ name: r.category, value: r.total })),
    [data],
  );

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
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-2 text-sm">
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          />
        </div>
      </div>

      {isLoading && !data ? (
        <div className="text-sm text-slate-500">Loading admin KPIs…</div>
      ) : !data ? (
        <div className="text-sm text-slate-500">
          No data available for this period.
        </div>
      ) : (
        <>
          {/* Member KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Total Members" value={data.members.total} />
            <Kpi label="Active" value={data.members.active} tone="ok" />
            <Kpi label="Inactive" value={data.members.inactive} tone="warn" />
            <Kpi
              label="Pending Approval"
              value={data.members.pending_approval}
              tone="warn"
            />
            <Kpi label="New This Period" value={data.members.new_this_period} />
            <Kpi
              label="Corporate / Individual"
              value={`${data.members.corporate} / ${data.members.individual}`}
            />
          </div>

          {/* Revenue + invites strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Kpi
              label="Collected (period)"
              value={fmtKes(data.revenue.collected_this_period)}
              tone="ok"
            />
            <Kpi
              label="Pending Invoices"
              value={data.revenue.pending_invoices}
              tone="warn"
            />
            <Kpi
              label="Pending Amount"
              value={fmtKes(data.revenue.pending_amount)}
              tone="warn"
            />
            <Kpi label="Pending Invites" value={data.invites.pending_invites} />
            <Kpi
              label="Pending Transfers"
              value={data.invites.pending_transfers}
            />
          </div>

          {/* Batches — this month + all time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
                Batches — This Month
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {data.batches.this_month.count}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Batches
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-emerald-700">
                    {data.batches.this_month.paid_count}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Paid
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-amber-700">
                    {data.batches.this_month.pending_count}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Pending
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 mt-3 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Collected
                  </div>
                  <div className="font-semibold text-slate-900">
                    {fmtKes(data.batches.this_month.total_collected)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Branch Share
                  </div>
                  <div className="font-semibold text-slate-900">
                    {fmtKes(data.batches.this_month.branch_share)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    HQ Share
                  </div>
                  <div className="font-semibold text-slate-900">
                    {fmtKes(data.batches.this_month.hq_share)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
                Batches — All Time
              </div>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Collected
                  </div>
                  <div className="text-base font-semibold text-slate-900">
                    {fmtKes(data.batches.all_time.total_collected)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Commission
                  </div>
                  <div className="text-base font-semibold text-slate-900">
                    {fmtKes(data.batches.all_time.total_commission)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Branch Share
                  </div>
                  <div className="text-base font-semibold text-slate-900">
                    {fmtKes(data.batches.all_time.total_branch_share)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    HQ Share
                  </div>
                  <div className="text-base font-semibold text-slate-900">
                    {fmtKes(data.batches.all_time.total_hq_share)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Paid Total
                  </div>
                  <div className="text-base font-semibold text-emerald-700">
                    {fmtKes(data.batches.all_time.paid_total)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    Pending Total
                  </div>
                  <div className="text-base font-semibold text-amber-700">
                    {fmtKes(data.batches.all_time.pending_total)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payments trend */}
          {showTrend && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
                Payments Trend (invoices by status)
              </div>
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
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="plainline"
                  />
                  <Line
                    type="monotone"
                    dataKey="fully_paid"
                    name="Fully paid"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="partially_paid"
                    name="Partially paid"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="not_paid"
                    name="Not paid"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Doughnut charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DonutCard title="Members by Category" data={categoryChart} />
            <DonutCard title="Members by Chapter" data={chapterChart} />
          </div>

          {/* Branches table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              Branches
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
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
                        className="px-4 py-6 text-center text-slate-500"
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
          </div>

          {/* Pending members table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              Recent Pending Approvals
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
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
                        className="px-4 py-6 text-center text-slate-500"
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
          </div>
        </>
      )}
    </div>
  );
}
