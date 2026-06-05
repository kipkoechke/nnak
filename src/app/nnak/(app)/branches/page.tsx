"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakBranches } from "@/hooks/use-branches";
import { useMembers } from "@/hooks/use-members";
import { useEmployerTypes } from "@/hooks/use-enums";

const TONE: Record<string, string> = {
  MOH: "bg-blue-100 text-blue-800",
  Parastatal: "bg-violet-100 text-violet-800",
  Private: "bg-emerald-100 text-emerald-800",
  FBO: "bg-amber-100 text-amber-800",
  Other: "bg-slate-200 text-slate-700",
};

export default function NnakBranchesPage() {
  const { data: branches = [] } = useNnakBranches();
  const { data: allMembers } = useMembers({ per_page: 1000 });
  const { data: employerTypes = [] } = useEmployerTypes();
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");

  const countFor = (id: string) =>
    allMembers?.data.filter((m) => m.profile.branch_id === id).length ?? 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (filterType && (b.employer_type || "") !== filterType) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [branches, filterType, search]);

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Branches" description="NNAK branches & geographic drill-down (FR-RA-004)" />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search branch…"
          className="px-3 py-2 border border-slate-300 rounded-md text-sm w-64"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All employer types</option>
          {employerTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">
          {filtered.length} of {branches.length} branches
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Employer Type</th>
              <th className="px-4 py-2 hidden md:table-cell">County</th>
              <th className="px-4 py-2 text-right">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => {
              const t = b.employer_type || "Other";
              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{b.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${TONE[t] || TONE.Other}`}>
                      {t}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 hidden md:table-cell">{b.county || "—"}</td>
                  <td className="px-4 py-2 text-right">{countFor(b.id)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">No branches match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
