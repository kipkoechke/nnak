"use client";
import { useMemo, useState } from "react";
import { useBranchDashboard } from "@/hooks/use-branch-manager";

const Kpi = ({ label, value, tone = "default" }: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "ok";
}) => (
  <div className={`bg-white rounded-lg border p-4 ${
    tone === "warn" ? "border-amber-200" :
    tone === "ok" ? "border-emerald-200" : "border-slate-200"
  }`}>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export default function BranchDashboard() {
  const [start, setStart] = useState(monthsAgoIso(1));
  const [end, setEnd] = useState(todayIso());
  const params = useMemo(() => ({ start_date: start, end_date: end }), [start, end]);
  const { data, isLoading } = useBranchDashboard(params);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
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
        {data?.branch_name && (
          <div className="text-sm text-slate-700">
            <span className="font-semibold">{data.branch_name}</span>
          </div>
        )}
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
            <Kpi label="Pending Approval" value={data.pending_approval_members} tone="warn" />
            <Kpi
              label="Collected (KES)"
              value={Number(data.total_collected_amount || 0).toLocaleString()}
            />
          </div>
        </>
      )}
    </div>
  );
}
