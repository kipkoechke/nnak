"use client";
import { useMemo, useState } from "react";
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

const Kpi = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "ok";
}) => (
  <div
    className={`bg-white rounded-lg border p-4 ${
      tone === "warn"
        ? "border-amber-200"
        : tone === "ok"
          ? "border-emerald-200"
          : "border-slate-200"
    }`}
  >
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
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
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

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
      (data?.chapter_totals ?? []).map((r) => ({
        name: r.chapter_label,
        value: r.total_members,
      })),
    [data],
  );

  const recentMembers = data?.recent_members ?? [];

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branch Dashboard"
        description={`Welcome, ${user.name}`}
        action={
          data?.branch_name ? (
            <span className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              {data.branch_name}
            </span>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Kpi label="Total Members" value={data.total_members} />
            <Kpi label="Active" value={data.active_members} tone="ok" />
            <Kpi label="Inactive" value={data.inactive_members} tone="warn" />
            <Kpi
              label="Pending Approval"
              value={data.pending_approval_members}
              tone="warn"
            />
            <Kpi
              label="Collected (KES)"
              value={Number(data.total_collected_amount || 0).toLocaleString()}
            />
          </div>

          {/* Chapter doughnut chart */}
          <DonutCard title="Members by Chapter" data={chapterChart} />

          {/* Recent members table */}
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
                    <th className="px-4 py-2">NCK Number</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No recent members.
                      </td>
                    </tr>
                  ) : (
                    recentMembers.map((m) => (
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
