"use client";
import { useState } from "react";
import { MdAdd } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories";
import type { BillingFrequency, MemberCategory, NnakMembershipCategory } from "@/types/nnak";

const empty = {
  name: "",
  code: "individual" as NnakMembershipCategory,
  billing_frequency: "annual" as BillingFrequency,
  annual_fee: 0,
  monthly_fee: null as number | null,
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
      name: c.name, code: c.code, billing_frequency: c.billing_frequency,
      annual_fee: c.annual_fee, monthly_fee: c.monthly_fee, description: c.description || "",
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await update.mutateAsync({ id: editing.id, patch: form });
    else await create.mutateAsync(form);
    setEditing(null); setForm(empty); setShowForm(false);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Membership Categories"
        description="Tiered pricing"
        action={
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(empty); }}
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
              {["individual","student","moh","county","parastatal","private","fbo"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.billing_frequency} onChange={(e) => setForm({...form, billing_frequency: e.target.value as BillingFrequency})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="annual">Annual</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.annual_fee} onChange={(e) => setForm({...form, annual_fee: Number(e.target.value)})} placeholder="Annual fee (KES)" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
            <input type="number" value={form.monthly_fee ?? ""} onChange={(e) => setForm({...form, monthly_fee: e.target.value ? Number(e.target.value) : null})} placeholder="Monthly fee (KES)" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-primary text-white text-sm px-4 py-2 rounded">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }} className="px-4 py-2 border rounded text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Billing</th><th className="px-3 py-2">Annual Fee</th><th className="px-3 py-2">Monthly Fee</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-sm text-center text-slate-500">No categories yet</td></tr>
            )}
            {data.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 capitalize">{c.code}</td>
                <td className="px-3 py-2 capitalize">{c.billing_frequency}</td>
                <td className="px-3 py-2">KES {(c.annual_fee ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2">{c.monthly_fee ? `KES ${c.monthly_fee.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-2 text-right">
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
