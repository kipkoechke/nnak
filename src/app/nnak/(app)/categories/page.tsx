"use client";
import { useState } from "react";
import { MdAdd } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories";
import type { BillingFrequency, MemberCategory, NnakMembershipCategory } from "@/types/nnak";

/** Seeded codes, in the order the register lists them. */
const CATEGORY_CODES: NnakMembershipCategory[] = [
  "individual",
  "checkoff",
  "student",
  "lifetime",
  "honorary",
  "moh",
  "county",
  "parastatal",
  "private",
  "fbo",
];

const FREQUENCY_LABEL: Record<BillingFrequency, string> = {
  monthly: "Monthly",
  annual: "Annual",
  one_time: "One-off",
};

const empty = {
  name: "",
  code: "individual" as NnakMembershipCategory,
  billing_frequency: "annual" as BillingFrequency,
  /** One cycle's fee; the API keeps a single `subscription_fee`. */
  fee: 0,
  grace_period_months: 3,
  is_active: true,
  description: "",
};

export default function CategoriesPage() {
  const { data = [] } = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MemberCategory | null>(null);
  const [form, setForm] = useState(empty);

  const beginEdit = (c: MemberCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      code: c.code,
      billing_frequency: c.billing_frequency,
      fee: c.subscription_fee ?? c.annual_fee ?? c.monthly_fee ?? 0,
      grace_period_months: c.grace_period_months ?? 0,
      is_active: c.is_active ?? true,
      description: c.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = form.billing_frequency === "monthly";
    const payload = {
      name: form.name,
      code: form.code,
      billing_frequency: form.billing_frequency,
      subscription_fee: form.fee,
      // Kept in step with the fee for the screens that still read the split.
      annual_fee: monthly ? 0 : form.fee,
      monthly_fee: monthly ? form.fee : null,
      grace_period_months: form.grace_period_months,
      is_active: form.is_active,
      description: form.description,
    };
    if (editing) await update.mutateAsync({ id: editing.id, patch: payload });
    else await create.mutateAsync(payload);
    closeForm();
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Membership Categories"
        description="Tiered pricing"
        action={
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdAdd className="w-4 h-4" /> New Category
          </button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold">{editing ? "Edit" : "New"} Category</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Name" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
            <select value={form.code} onChange={(e) => setForm({...form, code: e.target.value as NnakMembershipCategory})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              {CATEGORY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.billing_frequency} onChange={(e) => setForm({...form, billing_frequency: e.target.value as BillingFrequency})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="one_time">One-off (lifetime / honorary)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <label className="text-xs text-slate-500">
              {form.billing_frequency === "monthly"
                ? "Monthly fee (KES)"
                : form.billing_frequency === "one_time"
                  ? "One-off fee (KES)"
                  : "Annual fee (KES)"}
              <input type="number" min="0" step="1" value={form.fee} onChange={(e) => setForm({...form, fee: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900" />
            </label>
            <label className="text-xs text-slate-500">
              Grace period (months)
              <input type="number" min="0" step="1" value={form.grace_period_months} onChange={(e) => setForm({...form, grace_period_months: Number(e.target.value)})} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 self-end pb-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} className="accent-primary" />
              Active
            </label>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending || update.isPending} className="bg-primary text-white text-sm px-4 py-2 rounded disabled:opacity-50">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={closeForm} className="px-4 py-2 border rounded text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Billing</th>
              <th className="px-3 py-2 text-right">Fee</th>
              <th className="px-3 py-2 text-right">Grace</th>
              <th className="px-3 py-2">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-sm text-center text-slate-500">No categories yet</td></tr>
            )}
            {data.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium">
                  {c.name}
                  {c.description && (
                    <div className="text-[11px] text-slate-400">{c.description}</div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">{c.code}</td>
                <td className="px-3 py-2">{FREQUENCY_LABEL[c.billing_frequency] ?? c.billing_frequency}</td>
                <td className="px-3 py-2 text-right">
                  KES {(c.subscription_fee ?? c.annual_fee ?? 0).toLocaleString()}
                  <span className="text-[11px] text-slate-400">
                    {c.billing_frequency === "monthly" ? " /mo" : c.billing_frequency === "annual" ? " /yr" : ""}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {c.grace_period_months == null
                    ? "—"
                    : `${c.grace_period_months} mo`}
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${c.is_active === false ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {c.is_active === false ? "Inactive" : "Active"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => beginEdit(c)} className="text-xs text-primary mr-2">Edit</button>
                  <button onClick={() => confirm(`Delete ${c.name}?`) && remove.mutate(c.id)} className="text-xs text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
