"use client";
import { useState } from "react";
import Link from "next/link";
import { MdPeople, MdSearch } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useFinanceMembers, useFinanceBranches } from "@/hooks/use-finance";

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const AGING_OPTIONS = [
  { value: "", label: "All aging" },
  { value: "0-3", label: "0–3 months" },
  { value: "3-6", label: "3–6 months" },
  { value: "6-12", label: "6–12 months" },
  { value: "12+", label: "12+ months" },
];

export default function FinanceMembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [aging, setAging] = useState("");

  const { data, isLoading } = useFinanceMembers({
    page,
    per_page: 15,
    search: search || undefined,
    status: status || undefined,
    branch_id: branchId || undefined,
    aging: aging || undefined,
  });

  const { data: branchesData } = useFinanceBranches({ per_page: 100 });
  const branches = branchesData?.data ?? [];

  const members = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Members"
        description="Finance view of all registered members"
      />

      <div className="flex flex-wrap gap-2 items-end shrink-0">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, NCK…"
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={aging}
          onChange={(e) => { setAging(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          {AGING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-lg overflow-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <MdPeople className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No members found.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Membership No.</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Chapter of Interest</th>
                <th className="px-3 py-2 text-center">Aging (mo.)</th>
                <th className="px-3 py-2">Coverage Ends</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{m.membership_number}</td>
                  <td className="px-3 py-2 text-xs">{m.membership_type}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-[140px] truncate">
                    {m.branch_name || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{m.chapter}</td>
                  <td className="px-3 py-2 text-center">
                    {m.aging_months != null ? (
                      <span
                        className={`text-xs font-semibold ${
                          m.aging_months >= 12
                            ? "text-red-600"
                            : m.aging_months >= 6
                              ? "text-amber-600"
                              : "text-emerald-700"
                        }`}
                      >
                        {m.aging_months}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(m.last_coverage_end)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        m.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/nnak/finance/members/${m.id}`}
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

      {pagination && (
        <div className="shrink-0">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
