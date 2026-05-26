"use client";
import { useState } from "react";
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
  const [editing, setEditing] = useState<MemberCategory | null>(null);
  const [form, setForm] = useState(empty);

  const beginEdit = (c: MemberCategory) => {
    setEditing(c);
    setForm({
      name: c.name, code: c.code, billing_frequency: c.billing_frequency,
      annual_fee: c.annual_fee, monthly_fee: c.monthly_fee, description: c.description || "",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await update.mutateAsync({ id: editing.id, patch: form });
    else await create.mutateAsync(form);
    setEditing(null); setForm(empty);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Membership Categories" description="Tiered pricing per SRS FR-MP-002" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold">{editing ? "Edit" : "New"} Category</div>
          <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Name" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <select value={form.code} onChange={(e) => setForm({...form, code: e.target.value as NnakMembershipCategory})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            {["individual","student","moh","county","parastatal","private","fbo"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.billing_frequency} onChange={(e) => setForm({...form, billing_frequency: e.target.value as BillingFrequency})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option value="annual">Annual</option><option value="monthly">Monthly</option>
          </select>
          <input type="number" value={form.annual_fee} onChange={(e) => setForm({...form, annual_fee: Number(e.target.value)})} placeholder="Annual fee (KES)" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <input type="number" value={form.monthly_fee ?? ""} onChange={(e) => setForm({...form, monthly_fee: e.target.value ? Number(e.target.value) : null})} placeholder="Monthly fee (KES)" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" rows={2} />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-primary text-white text-sm px-3 py-2 rounded">{editing ? "Update" : "Create"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="px-3 py-2 border rounded text-sm">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Billing</th><th className="px-3 py-2">Fee</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">{c.code}</td>
                  <td className="px-3 py-2 capitalize">{c.billing_frequency}</td>
                  <td className="px-3 py-2">KES {c.billing_frequency === "monthly" ? c.monthly_fee : c.annual_fee}</td>
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
    </div>
  );
}
