"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useKpis } from "@/hooks/nnak/use-reports";
import { useMembers } from "@/hooks/nnak/use-members";
import { usePayments } from "@/hooks/nnak/use-payments";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

const download = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const { data: k } = useKpis();
  const { data: members } = useMembers({ per_page: 1000 });
  const { data: payments } = usePayments({ per_page: 1000 });
  const [tab, setTab] = useState<"members"|"financial"|"events">("members");

  const exportMembers = () => {
    const rows = members?.data.map((m) => ({
      account_number: m.profile.account_number,
      name: m.name, email: m.email, phone: m.profile.phone,
      nck_number: m.profile.nck_number, status: m.profile.status,
      branch: m.profile.branch_id, category: m.profile.member_category_id,
    })) || [];
    download(`nnak-members-${new Date().toISOString().slice(0,10)}.csv`, toCsv(rows));
  };
  const exportPayments = () => {
    const rows = payments?.data.map((p) => ({
      paid_at: p.paid_at, reference: p.reference, method: p.method,
      purpose: p.purpose, amount: p.amount, status: p.status,
    })) || [];
    download(`nnak-payments-${new Date().toISOString().slice(0,10)}.csv`, toCsv(rows));
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Reports & Analytics" description="FR-RA-005..009" />
      <div className="flex gap-2">
        {(["members","financial","events"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full border ${tab === t ? "bg-primary text-white border-primary" : "bg-white border-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold">Membership Register Export</div>
            <button onClick={exportMembers} className="bg-primary text-white text-xs px-3 py-1.5 rounded">Export CSV</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {k?.by_category.map((c) => (
              <div key={c.category} className="border border-slate-200 rounded p-2">
                <div className="text-xs text-slate-500">{c.category}</div>
                <div className="text-lg font-semibold">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "financial" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <div className="text-sm font-semibold">Revenue Report</div>
            <button onClick={exportPayments} className="bg-primary text-white text-xs px-3 py-1.5 rounded">Export CSV</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Period</th><th className="px-3 py-2 text-right">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {k?.revenue_trend.map((r) => (
                <tr key={r.period}><td className="px-3 py-2">{r.period}</td><td className="px-3 py-2 text-right">KES {r.revenue.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "events" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          Event ROI report — combine registrants, revenue, and attendance from the Events page. Per-event Excel/CSV available from the event detail.
        </div>
      )}
    </div>
  );
}
