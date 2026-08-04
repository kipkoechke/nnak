"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MdSearch } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useBranchBatch } from "@/hooks/use-branch-batches";

const fmt = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

/** Members inside a batch are paged server-side; the detail `meta` carries no
 *  page count, so paging is driven by whether a full page came back. */
const MEMBERS_PER_PAGE = 15;

export default function BranchBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const { data: batch, isLoading } = useBranchBatch(id, {
    search: memberSearch || undefined,
    page: memberPage,
    per_page: MEMBERS_PER_PAGE,
  });
  const members = batch?.members ?? [];

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading batch…</div>;
  }
  if (!batch) {
    return <div className="p-6 text-sm text-slate-500">Batch not found.</div>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={`Batch · ${batch.period}`}
        description={batch.branch?.name}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] px-2 py-1 rounded-full uppercase font-semibold ${
              STATUS_TONE[batch.status] || STATUS_TONE.pending
            }`}
          >
            {String(batch.status).replace(/_/g, " ")}
          </span>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Members"
          value={(
            batch.members_count ??
            batch.members?.length ??
            0
          ).toLocaleString()}
        />
        <Stat
          label="Collected"
          value={`KES ${Number(batch.total_collected).toLocaleString()}`}
        />
        <Stat
          label="Branch Share"
          value={`KES ${Number(batch.branch_share).toLocaleString()}`}
        />
        <Stat
          label="Outstanding"
          value={`KES ${Number(batch.pending_remittance).toLocaleString()}`}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Reference
          </div>
          <div className="font-mono text-xs">{batch.reference_code}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Paid On
          </div>
          <div>{fmt(batch.paid_at)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Created
          </div>
          <div>{fmt(batch.created_at)}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Members in this batch
          </span>
          <div className="relative min-w-45 max-w-xs flex-1">
            <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
            <input
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setMemberPage(1);
              }}
              placeholder="Search member names…"
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {!members.length ? (
          <div className="p-6 text-sm text-center text-slate-500">
            {memberSearch ? "No members match the search." : "No members."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 text-right">Amount Paid</th>
                <th className="px-3 py-2 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium">
                    {m.user?.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">
                    {m.user?.email || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {/* The list sends `amount_paid`, the detail `amount`. */}
                    KES {Number(m.amount_paid ?? m.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    KES {Number(m.commission_amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(memberPage > 1 || members.length === MEMBERS_PER_PAGE) && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {memberPage}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                disabled={memberPage === 1}
                className="px-3 py-1 text-xs border border-slate-300 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setMemberPage((p) => p + 1)}
                disabled={members.length < MEMBERS_PER_PAGE}
                className="px-3 py-1 text-xs border border-slate-300 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {!!batch.payments?.length && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
            Payments recorded
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-xs">{fmt(p.paid_at)}</td>
                  <td className="px-3 py-2 text-xs capitalize">
                    {p.payment_method?.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.payment_reference || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    KES {Number(p.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {p.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
