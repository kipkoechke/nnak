"use client";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useCreateBranch, useNnakBranches } from "@/hooks/use-branches";
import { useEmployerTypes } from "@/hooks/use-enums";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import { MdAdd, MdClose } from "react-icons/md";
import type { CreateBranchInput } from "@/types/nnak";

const emptyBranch: CreateBranchInput = {
  name: "",
  employer_type: "Parastatal",
  branch_manager_email: "",
  branch_manager_name: "",
  branch_manager_phone: "",
};

export default function NnakBranchesPage() {
  const { data: me } = useNnakMe();
  const { data: branches = [] } = useNnakBranches();
  const { data: employerTypes = [] } = useEmployerTypes();
  const create = useCreateBranch();

  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateBranchInput>(emptyBranch);

  const canCreate = nnakCan.manageBranches(me);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (filterType && (b.employer_type || "") !== filterType) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [branches, filterType, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await create.mutateAsync(form).catch(() => null);
    if (r) {
      setOpen(false);
      setForm(emptyBranch);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branches"
        description="NNAK branches & geographic drill-down"
      />

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
        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
          >
            <MdAdd className="w-4 h-4" /> Create Branch
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Employer Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{b.name}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700">
                      {b.employer_type_label || b.employer_type || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            {filtered.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-sm">No branches match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && canCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Create branch</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <Field
              label="Branch name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Employer Type</label>
              <select
                value={form.employer_type}
                onChange={(e) => setForm({ ...form, employer_type: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                {employerTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 text-[11px] uppercase tracking-wide text-slate-500">
              Branch manager
            </div>
            <Field
              label="Name"
              value={form.branch_manager_name}
              onChange={(v) => setForm({ ...form, branch_manager_name: v })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Email"
                type="email"
                value={form.branch_manager_email}
                onChange={(v) => setForm({ ...form, branch_manager_email: v })}
                required
              />
              <Field
                label="Phone"
                value={form.branch_manager_phone}
                onChange={(v) => setForm({ ...form, branch_manager_phone: v })}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 border border-slate-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Create branch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);
