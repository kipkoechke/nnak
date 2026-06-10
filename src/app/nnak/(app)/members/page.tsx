"use client";
import { useState } from "react";
import Link from "next/link";
import { MdAdd, MdSearch } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import {
  useApproveMember,
  useMembers,
  useRejectMember,
  useSetMemberStatus,
} from "@/hooks/use-members";
import { useBranchMembers } from "@/hooks/use-branch-manager";
import { useCategories } from "@/hooks/use-categories";
import { useNnakBranches } from "@/hooks/use-branches";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  inactive: "bg-slate-50 text-slate-700 border-slate-200",
  archived: "bg-slate-100 text-slate-500 border-slate-300",
};

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("");

  const { data: me } = useNnakMe();
  const isBranchManager = me?.role === "branch" || me?.role === "branch_manager";

  const branchMembersQuery = useBranchMembers({
    page,
    per_page: 15,
    search: search || undefined,
  }, { enabled: isBranchManager });

  const adminMembersQuery = useMembers({
    page,
    per_page: 15,
    search: search || undefined,
    status: status || undefined,
    category_id: categoryId || undefined,
    branch_id: branchId || undefined,
  }, { enabled: !isBranchManager });

  const { data, isLoading } = isBranchManager ? branchMembersQuery : adminMembersQuery;
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches();
  const setStatusM = useSetMemberStatus();
  const approve = useApproveMember();
  const reject = useRejectMember();
  const canApprove = !isBranchManager && nnakCan.approveMembers(me);

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Members"
        description="NNAK member register"
        action={
          <Link
            href="/nnak/members/new"
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdAdd className="w-4 h-4" /> New Member
          </Link>
        }
      />

      <div className={`bg-white border border-slate-200 rounded-lg p-3 grid gap-2 ${isBranchManager ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
        <div className={`relative ${isBranchManager ? "" : "col-span-2 md:col-span-1"}`}>
          <MdSearch className="absolute left-2 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, licence, ID..."
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        {!isBranchManager && (
          <>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="">All statuses</option>
              {["pending","active","suspended","inactive","archived"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="">All categories</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-slate-500 text-sm">No members yet — create one to get started.</div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 hidden md:table-cell">Licence #</th>
                    <th className="px-4 py-2 hidden md:table-cell">Category</th>
                    <th className="px-4 py-2 hidden lg:table-cell">Branch</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link href={`/nnak/members/${m.profile?.id || m.id}`} className="font-semibold text-primary hover:underline">
                          {m.name}
                        </Link>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">{m.profile?.license_number || "—"}</td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        {m.profile?.member_category?.name ||
                          cats.find((c) => c.id === m.profile?.member_category_id)?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell">
                        {m.profile?.branch?.name ||
                          branches.find((b) => b.id === m.profile?.branch_id)?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          const isApproved = m.profile?.is_approved ?? (m.profile?.status === "active");
                          const status = isApproved ? "active" : "pending";
                          return (
                            <span className={`px-2 py-0.5 text-[11px] rounded-full border ${STATUS_COLOR[status]}`}>
                              {status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        {canApprove && m.profile && !(m.profile.is_approved ?? false) && (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => approve.mutate(m.profile!.id)}
                              className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md hover:bg-emerald-100 disabled:opacity-50 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => {
                                if (confirm(`Reject ${m.name}?`)) reject.mutate(m.profile!.id);
                              }}
                              className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-100 disabled:opacity-50 font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {canApprove && m.profile?.is_approved && (
                          <button
                            onClick={() => setStatusM.mutate({ id: m.id, status: "suspended" })}
                            className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md hover:bg-amber-100 font-medium"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={data.meta?.current_page ?? 1}
              totalPages={data.meta?.last_page ?? 1}
              totalItems={data.meta?.total ?? data.data.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
