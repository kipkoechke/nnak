"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import { useBranchBatches } from "@/hooks/use-branch-batches";
import { MdReceipt } from "react-icons/md";
import type { BranchBatch } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

export default function BranchBatchesPage() {
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("");
  const { data: batches = [], isLoading } = useBranchBatches({
    period: period || undefined,
    status: status || undefined,
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Monthly Batches"
        description="Subscription remittance batches for your branch"
      />

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Period
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            <MdReceipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No batches for the selected filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2 text-right">Members</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b: BranchBatch) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{b.period}</td>
                  <td className="px-3 py-2 text-right">
                    {(b.member_count ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    KES {Number(b.total_amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    KES {Number(b.amount_paid ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    KES {Number(b.balance ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmt(b.due_date)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold whitespace-nowrap ${
                        STATUS_TONE[b.status] || STATUS_TONE.draft
                      }`}
                    >
                      {String(b.status).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/nnak/branch/batches/${b.id}`}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
