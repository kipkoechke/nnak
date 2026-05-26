"use client";
import PageHeader from "@/components/common/PageHeader";
import { useNnakBranches } from "@/hooks/use-branches";
import { useMembers } from "@/hooks/use-members";

export default function NnakBranchesPage() {
  const { data: branches = [] } = useNnakBranches();
  const { data: allMembers } = useMembers({ per_page: 1000 });

  const countFor = (id: string) =>
    allMembers?.data.filter((m) => m.profile.branch_id === id).length ?? 0;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Branches" description="NNAK branches & geographic drill-down (FR-RA-004)" />
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-2">Branch</th><th className="px-4 py-2">County</th><th className="px-4 py-2 text-right">Members</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {branches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{b.name}</td>
                <td className="px-4 py-2 text-slate-600">{b.county || "—"}</td>
                <td className="px-4 py-2 text-right">{countFor(b.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
