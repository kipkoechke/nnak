"use client";
import { useState } from "react";
import Link from "next/link";
import { MdSearch, MdCorporateFare } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useFinanceBranches } from "@/hooks/use-finance";

export default function FinanceBranchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFinanceBranches({
    page,
    per_page: 20,
    search: search || undefined,
  });

  const branches = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Branches"
        description="Finance view of all corporate branches"
      />

      <div className="flex flex-wrap gap-2 items-end shrink-0">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search branch name…"
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-lg overflow-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center">
            <MdCorporateFare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No branches found.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Employer Type</th>
                <th className="px-3 py-2">Commission</th>
                <th className="px-3 py-2 text-right">Members</th>
                <th className="px-3 py-2 text-right">Paid Share</th>
                <th className="px-3 py-2 text-right">Pending Share</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{b.name}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{b.employer_type}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="capitalize">{b.commission_type.replace(/_/g, " ")}</span>
                    {" · "}
                    <span className="font-mono">{b.commission_value}</span>
                  </td>
                  <td className="px-3 py-2 text-right">{b.member_count}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    KES {Number(b.total_paid_branch_share).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(b.pending_branch_share) > 0 ? (
                      <span className="text-amber-700 font-medium">
                        KES {Number(b.pending_branch_share).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/nnak/finance/branches/${b.id}`}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
