"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MdAdd, MdSearch, MdUploadFile, MdDownload } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import {
  useImportMembers,
  useMembers,
  useSetMemberStatus,
} from "@/hooks/use-members";
import { membersService } from "@/services/members.service";
import { useBranchMembers } from "@/hooks/use-branch-manager";
import { useCategories } from "@/hooks/use-categories";
import { useNnakBranches } from "@/hooks/use-branches";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import { ModalShell } from "@/components/common/Modal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { SearchableSelect } from "@/components/common/SearchableSelect";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  inactive: "bg-slate-50 text-slate-700 border-slate-200",
  archived: "bg-slate-100 text-slate-500 border-slate-300",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...["pending", "active", "suspended", "inactive", "archived"].map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

/** Aging buckets (months since last coverage) supported by GET /admin/members. */
const AGING_OPTIONS = [
  { value: "", label: "All ages" },
  { value: "0", label: "Current", description: "No months outstanding" },
  { value: "1-3", label: "1 – 3 months", description: "Recently lapsed" },
  { value: "4-6", label: "4 – 6 months" },
  { value: "7-12", label: "7 – 12 months" },
  { value: "12+", label: "Over 12 months", description: "Long overdue" },
];

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [aging, setAging] = useState("");

  const { data: me } = useNnakMe();
  const isBranchManager =
    me?.role === "branch" || me?.role === "branch_manager";

  const branchMembersQuery = useBranchMembers(
    {
      page,
      per_page: 15,
      search: search || undefined,
    },
    { enabled: isBranchManager },
  );

  const adminMembersQuery = useMembers(
    {
      page,
      per_page: 15,
      search: search || undefined,
      status: status || undefined,
      member_category_id: categoryId || undefined,
      branch_id: branchId || undefined,
      aging: aging || undefined,
    },
    { enabled: !isBranchManager },
  );

  const { data, isLoading } = isBranchManager
    ? branchMembersQuery
    : adminMembersQuery;
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches({ enabled: !isBranchManager });
  const setStatusM = useSetMemberStatus();
  const importMembers = useImportMembers();
  const canManageStatus = !isBranchManager && nnakCan.approveMembers(me);
  const canImport = !isBranchManager && nnakCan.manageMembers(me);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...cats.map((c) => ({ value: c.id, label: c.name })),
    ],
    [cats],
  );
  const branchOptions = useMemo(
    () => [
      { value: "", label: "All branches" },
      ...branches.map((b) => ({ value: b.id, label: b.name })),
    ],
    [branches],
  );

  const [showImport, setShowImport] = useState(false);
  const [importBranch, setImportBranch] = useState("");
  const [importCategory, setImportCategory] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  const submitImport = () => {
    if (!importFile || !importBranch) return;
    importMembers.mutate(
      {
        file: importFile,
        branch_id: importBranch,
        member_category_code: importCategory || undefined,
      },
      {
        onSuccess: () => {
          setShowImport(false);
          setImportFile(null);
          setImportBranch("");
          setImportCategory("");
        },
      },
    );
  };

  const downloadTemplate = async () => {
    const blob = await membersService.importTemplate().catch(() => null);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend";
    memberId: string;
    memberName: string;
  } | null>(null);

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-4 gap-3 overflow-hidden">
      <PageHeader
        title="Members"
        description="NNAK member register"
        action={
          <div className="flex items-center gap-2">
            {canImport && (
              <>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
                >
                  <MdDownload className="w-4 h-4" /> Template
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-1 border border-primary text-primary px-3 py-1.5 rounded-lg text-sm hover:bg-primary-subtle"
                >
                  <MdUploadFile className="w-4 h-4" /> Import
                </button>
              </>
            )}
            <Link
              href="/nnak/members/new"
              className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
            >
              <MdAdd className="w-4 h-4" /> New Member
            </Link>
          </div>
        }
      />

      <div
        className={`bg-white border border-slate-200 rounded-lg p-3 grid gap-2 items-end ${isBranchManager ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-5"}`}
      >
        <div
          className={`relative ${isBranchManager ? "" : "col-span-2 md:col-span-1"}`}
        >
          <MdSearch className="absolute left-2 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, membership no, ID..."
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        {!isBranchManager && (
          <>
            <SearchableSelect
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              placeholder="All statuses"
              searchPlaceholder="Search statuses…"
            />
            <SearchableSelect
              options={categoryOptions}
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
              placeholder="All categories"
              searchPlaceholder="Search categories…"
            />
            <SearchableSelect
              options={branchOptions}
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setPage(1);
              }}
              placeholder="All branches"
              searchPlaceholder="Search branches…"
            />
            <SearchableSelect
              options={AGING_OPTIONS}
              value={aging}
              onChange={(v) => {
                setAging(v);
                setPage(1);
              }}
              placeholder="All ages"
              searchPlaceholder="Search aging…"
            />
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No members yet — create one to get started.
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 hidden md:table-cell">
                      Membership No.
                    </th>
                    <th className="px-4 py-2 hidden md:table-cell">Category</th>
                    <th className="px-4 py-2 hidden lg:table-cell">Branch</th>
                    <th className="px-4 py-2">Approval</th>
                    <th className="px-4 py-2">Subscription</th>
                    <th className="px-4 py-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link
                          href={`/nnak/members/${m.profile?.id || m.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {m.name}
                        </Link>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        {m.profile?.membership_number || "—"}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        {m.profile?.member_category?.name ||
                          cats.find(
                            (c) => c.id === m.profile?.member_category_id,
                          )?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell">
                        {m.profile?.branch?.name ||
                          branches.find((b) => b.id === m.profile?.branch_id)
                            ?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          const isApproved =
                            m.profile?.is_approved ??
                            m.profile?.status === "active";
                          const s = isApproved ? "active" : "pending";
                          return (
                            <span
                              className={`px-2 py-0.5 text-[11px] rounded-full border ${STATUS_COLOR[s]}`}
                            >
                              {s}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          const subActive =
                            m.profile?.subscription_active ?? false;
                          return (
                            <span
                              className={`px-2 py-0.5 text-[11px] rounded-full border ${subActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                            >
                              {subActive ? "Active" : "Inactive"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        {canManageStatus && m.profile?.is_approved && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: "suspend",
                                memberId: m.id,
                                memberName: m.name,
                              })
                            }
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

      <ModalShell
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
      >
        <DeleteConfirmationModal
          itemName={confirmAction?.memberName ?? ""}
          itemType="member"
          title="Suspend Member"
          message={`Are you sure you want to suspend "${confirmAction?.memberName}"?`}
          confirmLabel="Suspend"
          isDeleting={setStatusM.isPending}
          onConfirm={() => {
            if (!confirmAction) return;
            setStatusM.mutate({
              id: confirmAction.memberId,
              status: "suspended",
            });
            setConfirmAction(null);
          }}
        />
      </ModalShell>

      <ModalShell isOpen={showImport} onClose={() => setShowImport(false)}>
        <div className="p-5 space-y-4 w-full max-w-md">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Import Members
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Download the template, fill it in, then upload it here. All rows
              are imported into the selected branch.
            </p>
          </div>

          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MdDownload className="w-4 h-4" /> Download import template
          </button>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={importBranch}
              onChange={(e) => setImportBranch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Member category (optional)
            </label>
            <select
              value={importCategory}
              onChange={(e) => setImportCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Use category from file</option>
              {cats.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Excel/CSV, up to 10 MB.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowImport(false)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitImport}
              disabled={!importFile || !importBranch || importMembers.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {importMembers.isPending ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
