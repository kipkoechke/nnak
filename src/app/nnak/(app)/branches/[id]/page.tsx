"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import { useBranch } from "@/hooks/use-branches";
import {
  MdPeople,
  MdBusiness,
  MdLocationOn,
  MdPerson,
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
            <Field label="County" value={branch.county || "—"} />
            <Field label="Member Count" value={(branch.member_count ?? 0).toLocaleString()} />
            <Field label="Branch ID" value={branch.id} />
            <Field label="Secretariat" value={branch.secretariat_user_id ? "Assigned" : "Not assigned"} />
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
          </div>
        </Section>

        {/* Footer timestamps */}
        <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
          <span>Created: {fmtDateTime(branch.created_at)}</span>
          <span>Updated: {fmtDateTime(branch.updated_at)}</span>
        </div>
      </div>
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
