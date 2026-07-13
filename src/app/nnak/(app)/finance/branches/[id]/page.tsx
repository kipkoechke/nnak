"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useFinanceBranch } from "@/hooks/use-finance";
import type { FinanceBranchMember } from "@/types/nnak";

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

export default function FinanceBranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: branch, isLoading } = useFinanceBranch(id);

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading branch…</div>;
  if (!branch)
    return <div className="p-4 text-sm text-slate-500">Branch not found.</div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={branch.name}
        description={branch.employer_type_label}
        back={() => router.back()}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Members" value={branch.members.length} />
        <Stat
          label="Commission Type"
          value={
            <span className="text-sm capitalize">
              {branch.commission_type_label}
            </span>
          }
        />
        <Stat label="Commission Value" value={branch.commission_value} />
        <Stat
          label="Manager"
          value={
            <span className="text-sm">
              {(branch.manager as { name?: string } | null)?.name || "—"}
            </span>
          }
        />
      </div>

      {/* Members table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            Members ({branch.members.length})
          </span>
        </div>
        {branch.members.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            No members in this branch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Membership No.</th>
                  <th className="px-3 py-2">Chapter of Interest</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Subscription</th>
                  <th className="px-3 py-2 text-right">Pending Inv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branch.members.map((m: FinanceBranchMember) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {m.membership_number}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {m.chapter_label || m.chapter}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {m.member_category?.name || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {m.subscription_active ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          Inactive
                        </span>
                      )}
                      {m.subscription_expires_at && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          until {fmtDate(m.subscription_expires_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {m.pending_invoices_total > 0 ? (
                        <span className="text-xs font-semibold text-amber-700">
                          KES {Number(m.pending_invoices_total).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
