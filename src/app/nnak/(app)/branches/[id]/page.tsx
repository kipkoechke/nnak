"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import {
  useBranch,
  useAdminBranchMembers,
  useChangeBranchManager,
} from "@/hooks/use-branches";
import {
  MdPeople,
  MdBusiness,
  MdLocationOn,
  MdPerson,
  MdClose,
  MdSwapHoriz,
} from "react-icons/md";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: branch, isLoading } = useBranch(id);
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { data: membersData, isLoading: membersLoading } = useAdminBranchMembers(
    showChangeManager ? id : undefined,
  );
  const changeManager = useChangeBranchManager();
  const members = membersData?.data ?? [];

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await changeManager.mutateAsync({ branchId: id, userId: selectedUserId }).catch(() => null);
    setShowChangeManager(false);
    setSelectedUserId("");
  };

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!branch)
    return (
      <div className="p-4 text-sm text-slate-500">Branch not found</div>
    );

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Header */}
      <PageHeader
        title={branch.name}
        description={`Branch · ${branch.employer_type_label || branch.employer_type || "N/A"}`}
        back={() => router.back()}
      />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard
          icon={<MdPeople className="w-4 h-4 text-blue-600" />}
          bg="bg-blue-50"
          label="Members"
          value={(branch.member_count ?? 0).toLocaleString()}
        />
        <StatCard
          icon={<MdBusiness className="w-4 h-4 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Employer Type"
          value={branch.employer_type_label || branch.employer_type || "—"}
        />
        <StatCard
          icon={<MdLocationOn className="w-4 h-4 text-amber-600" />}
          bg="bg-amber-50"
          label="County"
          value={branch.county || "—"}
        />
        <StatCard
          icon={<MdPerson className="w-4 h-4 text-purple-600" />}
          bg="bg-purple-50"
          label="Chair"
          value={branch.chair_user_id ? "Assigned" : "Not assigned"}
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        <Section title="Branch Details">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Branch Name" value={branch.name} />
            <Field label="Employer Type" value={branch.employer_type_label || branch.employer_type || "—"} />
            <Field label="Commission Type" value={branch.commission_type_label || branch.commission_type || "—"} />
            <Field label="Commission Value" value={branch.commission_value ?? "—"} />
            <Field label="Branch ID" value={branch.id} />
            {branch.county && <Field label="County" value={branch.county} />}
          </div>
        </Section>

        <Section title="Actions">
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/nnak/branches`}
              className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-slate-50"
            >
              View All Branches
            </Link>
            <Link
              href={`/nnak/members?branch_id=${branch.id}`}
              className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3 py-2 rounded-md hover:bg-primary/90"
            >
              View Members
            </Link>
            <button
              onClick={() => setShowChangeManager(true)}
              className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-amber-50"
            >
              <MdSwapHoriz className="w-4 h-4" />
              Change Manager
            </button>
          </div>
        </Section>

        {/* Footer timestamps */}
        <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
          <span>Created: {fmtDateTime(branch.created_at)}</span>
          <span>Updated: {fmtDateTime(branch.updated_at)}</span>
        </div>
      </div>

      {showChangeManager && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleChangeManager}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Change Branch Manager</h3>
                <p className="text-xs text-slate-500 mt-0.5">{branch.name}</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select New Manager <span className="text-red-500">*</span>
              </label>
              {membersLoading ? (
                <div className="text-xs text-slate-400 py-2">Loading branch members…</div>
              ) : members.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No members found in this branch.</div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">— select a member —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.email ? `(${m.email})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUserId || changeManager.isPending}
                className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {changeManager.isPending ? "Changing…" : "Confirm Change"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const StatCard = ({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
    <div
      className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
      {title}
    </div>
    {children}
  </div>
);

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div>
    <div className="text-[11px] uppercase text-slate-500">{label}</div>
    <div className="text-sm text-slate-800">{value || "—"}</div>
  </div>
);
