"use client";
import { useMemo, useState } from "react";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

const Kpi = ({ label, value, hint, tone = "default" }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "ok";
}) => (
  <div className={`bg-white rounded-lg border p-4 ${
    tone === "warn" ? "border-amber-200" :
    tone === "danger" ? "border-red-200" :
    tone === "ok" ? "border-emerald-200" : "border-slate-200"
  }`}>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
  </div>
);

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export default function AdminDashboard() {
  const [start, setStart] = useState(monthsAgoIso(1));
  const [end, setEnd] = useState(todayIso());

  const params = useMemo(
    () => ({ start_date: start, end_date: end }),
    [start, end],
  );
  const { data, isLoading } = useAdminDashboard(params);

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
        <span className="text-[11px] text-slate-500 ml-auto">
          GET /admin/dashboard?start_date={start}&end_date={end}
        </span>
      </div>

      {isLoading && !data ? (
        <div className="text-sm text-slate-500">Loading admin KPIs…</div>
      ) : !data ? (
        <div className="text-sm text-slate-500">No data available for this period.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Total Members" value={data.total_members} />
            <Kpi label="Active" value={data.active_members} tone="ok" />
            <Kpi label="Inactive" value={data.inactive_members} tone="warn" />
            <Kpi label="Pending Approval" value={data.pending_approval_members} tone="warn" />
            <Kpi label="New in range" value={data.new_members_in_range} />
            <Kpi
              label="Collected (KES)"
              value={Number(data.total_collected_amount || 0).toLocaleString()}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              Members by category
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2 text-right">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.member_category_totals.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">No category breakdown available.</td>
                  </tr>
                ) : (
                  data.member_category_totals.map((row) => (
                    <tr key={row.category_id ?? "uncategorised"}>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {row.category_name ?? <span className="italic text-slate-400">All categories</span>}
                      </td>
                      <td className="px-4 py-2 text-right">{row.total_members}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
