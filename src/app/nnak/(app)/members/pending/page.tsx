"use client";
import PageHeader from "@/components/common/PageHeader";
import {
  useApproveMember,
  usePendingMembers,
  useRejectMember,
} from "@/hooks/use-members";
import { MdCheck, MdClose } from "react-icons/md";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function PendingMembersPage() {
  const { data, isLoading } = usePendingMembers({ per_page: 50 });
  const approve = useApproveMember();
  const reject = useRejectMember();

  const items = data?.data ?? [];

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Pending Approvals"
        description="Newly registered members awaiting HQ approval"
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2 hidden md:table-cell">Branch</th>
              <th className="px-4 py-2 hidden md:table-cell">Category</th>
              <th className="px-4 py-2 hidden lg:table-cell">Submitted</th>
              <th className="px-4 py-2 w-44 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No members awaiting approval.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const busy =
                  (approve.isPending && approve.variables === p.id) ||
                  (reject.isPending && reject.variables === p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <div className="font-semibold text-slate-900">
                        {p.user?.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">{p.user?.email ?? "—"}</div>
                      {p.nck_number && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          NCK {p.nck_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600 hidden md:table-cell">
                      {p.branch?.name || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600 hidden md:table-cell">
                      {p.member_category?.name || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600 hidden lg:table-cell">
                      {fmtDate(p.created_at)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        disabled={busy}
                        onClick={() => approve.mutate(p.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-medium px-2.5 py-1 rounded hover:bg-emerald-700 disabled:opacity-50 mr-2"
                      >
                        <MdCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Reject ${p.user?.name ?? "this member"}?`))
                            reject.mutate(p.id);
                        }}
                        className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        <MdClose className="w-3.5 h-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
