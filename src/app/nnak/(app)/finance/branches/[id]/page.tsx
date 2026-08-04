"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { MdGroups, MdPerson } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import DownloadButton from "@/components/common/DownloadButton";
import { useFinanceBranch } from "@/hooks/use-finance";
import { fmtCommissionValue, fmtKes } from "@/lib/commission";
import type { ExcelColumn } from "@/lib/export-excel";
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
    <div className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </div>
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

  // `members` is omitted on some responses; `members_count` is authoritative.
  const members = branch.members ?? [];
  const memberCount = branch.members_count ?? members.length;

  const exportColumns: ExcelColumn<FinanceBranchMember>[] = [
    { header: "Name", value: (m) => m.name },
    { header: "Email", value: (m) => m.email ?? "" },
    { header: "Membership No.", value: (m) => m.membership_number ?? "" },
    { header: "Chapter", value: (m) => m.chapter_label || m.chapter || "" },
    { header: "Category", value: (m) => m.member_category?.name ?? "" },
    {
      header: "Subscription",
      value: (m) => (m.subscription_active ? "Active" : "Inactive"),
    },
    {
      header: "Subscription Expires",
      value: (m) => m.subscription_expires_at ?? "",
    },
    {
      header: "Pending Invoices",
      value: (m) => Number(m.pending_invoices_total ?? 0),
    },
  ];

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={branch.name}
        description={branch.employer_type_label || branch.employer_type}
        back={() => router.back()}
        action={
          <DownloadButton
            filename={`branch-${branch.name}-members`}
            sheetName="Members"
            columns={exportColumns}
            rows={members}
          />
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Members" value={memberCount.toLocaleString()} />
        <Stat
          label="Commission Type"
          value={
            <span className="text-sm">
              {branch.commission_type_label ||
                branch.commission_type?.replace(/_/g, " ") ||
                "—"}
            </span>
          }
        />
        <Stat
          label="Commission Value"
          value={fmtCommissionValue(
            branch.commission_value,
            branch.commission_type,
          )}
        />
        <Stat
          label="Manager"
          value={
            <span className="text-sm">{branch.manager?.name || "Unassigned"}</span>
          }
        />
      </div>

      {/* Manager detail — the stat only has room for a name. */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
          Branch manager
        </div>
        {branch.manager ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MdPerson className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">
                {branch.manager.name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {[branch.manager.email, branch.manager.phone]
                  .filter(Boolean)
                  .join(" · ") || "No contact on file"}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No manager assigned to this branch yet.
          </p>
        )}
      </div>

      {/* Members table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            Members ({memberCount.toLocaleString()})
          </span>
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <MdGroups className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              No members in this branch
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Members appear here once they are assigned to this branch.
            </p>
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
                {members.map((m: FinanceBranchMember) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">
                        {m.email || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {m.membership_number || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {m.chapter_label || m.chapter || "—"}
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
                      {Number(m.pending_invoices_total) > 0 ? (
                        <span className="text-xs font-semibold text-amber-700">
                          {fmtKes(m.pending_invoices_total)}
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
