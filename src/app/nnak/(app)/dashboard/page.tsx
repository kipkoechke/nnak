"use client";
import { useKpis } from "@/hooks/use-reports";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan, isMemberRole } from "@/lib/rbac";
import PageHeader from "@/components/common/PageHeader";
import MemberDashboard from "./MemberDashboard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const Kpi = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
  </div>
);

export default function NnakDashboardPage() {
  const { data: user } = useNnakMe();
  const { data: k, isLoading } = useKpis();
  const showFinance = nnakCan.viewExecutiveKpis(user);

  if (isMemberRole(user)) {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        <PageHeader title="Member Portal" description="Your membership at a glance" />
        <MemberDashboard />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Dashboard" description={`Welcome, ${user?.name ?? ""}`} />
      {isLoading || !k ? (
        <div className="text-slate-500 text-sm">Loading KPIs…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Active Members" value={k.total_active_members} />
            <Kpi label="New This Month" value={k.new_members_this_month} />
            {showFinance && <Kpi label="Revenue MTD" value={`KES ${k.revenue_mtd.toLocaleString()}`} />}
            <Kpi label="Overdue Renewals" value={k.overdue_renewals} />
            <Kpi label="Upcoming Events" value={k.upcoming_events} />
            <Kpi label="Attendance 30d" value={`${k.attendance_rate_30d}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">Membership Growth (6m)</div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={k.membership_growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {showFinance && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-700 mb-3">Revenue (6m)</div>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={k.revenue_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#059669" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-700 mb-3">Members by Category</div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={k.by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
