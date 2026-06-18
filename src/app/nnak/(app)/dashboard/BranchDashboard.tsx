"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useBranchDashboard } from "@/hooks/use-branch-manager";
import PageHeader from "@/components/common/PageHeader";
import type { NnakUser } from "@/types/nnak";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  MdGroups,
  MdHowToReg,
  MdHourglassEmpty,
  MdPersonAdd,
  MdAttachMoney,
  MdReceiptLong,
  MdMailOutline,
  MdSwapHoriz,
} from "react-icons/md";

const DONUT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const fmtKes = (v: string | number) =>
  `KES ${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

const Kpi = ({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "ok" | "info";
}) => {
  const tones: Record<string, string> = {
    default: "border-slate-200 text-slate-900",
    ok: "border-emerald-200 text-emerald-700",
    warn: "border-amber-200 text-amber-700",
    info: "border-blue-200 text-blue-700",
  };
  return (
    <div className={`bg-white rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-200 rounded-lg">
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {description && (
        <div className="text-[11px] text-slate-500 mt-0.5">{description}</div>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const BatchMetricsCard = ({
  title,
  metrics,
}: {
  title: string;
  metrics: {
    count: number;
    paid_count: number;
    pending_count: number;
    total_collected: string | number;
    commission: string | number;
    branch_share: string | number;
  };
}) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
    <div className="text-xs uppercase tracking-wide text-slate-500">
      {title}
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-lg font-semibold text-slate-900">
          {metrics.count}
        </div>
        <div className="text-[10px] text-slate-500 uppercase">Members</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-emerald-700">
          {metrics.paid_count}
        </div>
        <div className="text-[10px] text-slate-500 uppercase">Paid</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-amber-700">
          {metrics.pending_count}
        </div>
        <div className="text-[10px] text-slate-500 uppercase">Pending</div>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
      <div>
        <div className="text-[10px] text-slate-500 uppercase">Collected</div>
        <div className="font-semibold text-slate-900">
          {fmtKes(metrics.total_collected)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-500 uppercase">Commission</div>
        <div className="font-semibold text-slate-900">
          {fmtKes(metrics.commission)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-500 uppercase">
          Branch Share
        </div>
        <div className="font-semibold text-slate-900">
          {fmtKes(metrics.branch_share)}
        </div>
      </div>
    </div>
  </div>
);

export default function BranchDashboard({ user }: { user: NnakUser }) {
  const [start, setStart] = useState(monthsAgoIso(1));
  const [end, setEnd] = useState(todayIso());
  const params = useMemo(
    () => ({ start_date: start, end_date: end }),
    [start, end],
  );
  const { data, isLoading } = useBranchDashboard(params);

  const chapterChart = useMemo(
    () =>
      (data?.chapters ?? []).map((r) => ({
        name: r.chapter_label,
        value: r.total_members,
      })),
    [data],
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Branch Dashboard"
        description={`Welcome, ${user.name}`}
        action={
          data?.branch?.name ? (
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {data.branch.name}
              </div>
              {data.branch.employer_type && (
                <div className="text-[11px] text-slate-500">
                  {data.branch.employer_type}
                </div>
              )}
            </div>
          ) : undefined
        }
      />

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
        <div className="text-sm text-slate-500">Loading branch KPIs…</div>
      ) : !data ? (
        <div className="text-sm text-slate-500">No branch data available.</div>
      ) : (
        <>
          {/* Member KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Kpi
              label="Total Members"
              value={data.members.total}
              icon={MdGroups}
            />
            <Kpi
              label="Active"
              value={data.members.active}
              icon={MdHowToReg}
              tone="ok"
            />
            <Kpi
              label="Inactive"
              value={data.members.inactive}
              icon={MdHourglassEmpty}
              tone="warn"
            />
            <Kpi
              label="Pending Approval"
              value={data.members.pending_approval}
              icon={MdHourglassEmpty}
              tone="warn"
            />
            <Kpi
              label="New This Period"
              value={data.members.new_this_period}
              icon={MdPersonAdd}
              tone="info"
            />
          </div>

          {/* Revenue + Invites strip */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Kpi
              label="Collected (period)"
              value={fmtKes(data.revenue.collected_this_period)}
              icon={MdAttachMoney}
              tone="ok"
            />
            <Kpi
              label="Pending Invoices"
              value={data.revenue.pending_invoices_count}
              icon={MdReceiptLong}
              tone="warn"
            />
            <Kpi
              label="Pending Total"
              value={fmtKes(data.revenue.pending_total)}
              icon={MdReceiptLong}
              tone="warn"
            />
            <Link
              href="/nnak/branch/invites"
              className="bg-white rounded-lg border border-slate-200 p-4 hover:border-primary/40 transition"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MdMailOutline className="w-4 h-4" /> Pending Invites
              </div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {data.invites.pending_invites}
              </div>
            </Link>
            <Link
              href="/nnak/branch/transfers"
              className="bg-white rounded-lg border border-slate-200 p-4 hover:border-primary/40 transition"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MdSwapHoriz className="w-4 h-4" /> Pending Transfers
              </div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {data.invites.pending_transfers}
              </div>
            </Link>
          </div>

          {/* Monthly batches */}
          <Section
            title="Monthly Batches"
            description="Subscription collections for the current and last month, with all-time totals"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <BatchMetricsCard
                title="Current Month"
                metrics={data.batches.current_month.metrics}
              />
              <BatchMetricsCard
                title="Last Month"
                metrics={data.batches.last_month.metrics}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                All-Time
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
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
          </Section>

          {/* Chapter doughnut */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
              Members by Chapter
            </div>
            {chapterChart.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chapterChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {chapterChart.map((_, i) => (
                      <Cell
                        key={i}
                        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                      />
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

          {/* Recent members */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              Recent Members
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Chapter</th>
                    <th className="px-4 py-2">NCK</th>
                    <th className="px-4 py-2">Subscription</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No recent members.
                      </td>
                    </tr>
                  ) : (
                    data.recent_members.map((m) => (
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
                        <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                          {m.profile?.nck_number ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {m.profile?.subscription_active ? (
                            <span className="inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {m.profile?.is_approved ? (
                            <span className="inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
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
