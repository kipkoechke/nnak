"use client";
import { useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import type { EventPricingTier, EventType, NnakEvent } from "@/types/nnak";

interface Props {
  initial?: Partial<NnakEvent>;
  onSubmit: (data: Partial<NnakEvent>) => Promise<void> | void;
  submitting?: boolean;
}

export default function EventForm({ initial, onSubmit, submitting }: Props) {
  const { data: cats = [] } = useCategories();
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    type: (initial?.type as EventType) || "cpd",
    status: initial?.status || "draft",
    starts_at: initial?.starts_at?.slice(0, 16) || "",
    ends_at: initial?.ends_at?.slice(0, 16) || "",
    venue: initial?.venue || "",
    capacity: initial?.capacity || 100,
    multi_day: initial?.multi_day || false,
  });
  const [pricing, setPricing] = useState<EventPricingTier[]>(
    initial?.pricing || [{ category_code: "non_member", fee: 0 }],
  );

  const updatePricing = (i: number, v: Partial<EventPricingTier>) => {
    setPricing((p) => p.map((row, idx) => (idx === i ? { ...row, ...v } : row)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      ...(initial?.id ? { id: initial.id } : {}),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      pricing,
    });
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 max-w-3xl">
      <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Event name" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value as EventType})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          {["conference","workshop","cpd","agm","training"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as NnakEvent["status"]})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          {["draft","published","closed","completed","cancelled"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({...form, starts_at: e.target.value})} required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({...form, ends_at: e.target.value})} required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
        <input value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} placeholder="Venue" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
        <input type="number" value={form.capacity} onChange={(e) => setForm({...form, capacity: Number(e.target.value)})} placeholder="Capacity" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
      </div>

      <div className="border border-slate-200 rounded-md p-3">
        <div className="text-sm font-semibold mb-2">Tiered Pricing (FR-EM-002)</div>
        {pricing.map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <select value={row.category_code} onChange={(e) => updatePricing(i, { category_code: e.target.value as EventPricingTier["category_code"] })} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="non_member">Non-member</option>
              {cats.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
            </select>
            <input type="number" value={row.fee} onChange={(e) => updatePricing(i, { fee: Number(e.target.value) })} placeholder="Fee (KES)" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
            <button type="button" onClick={() => setPricing(pricing.filter((_, idx) => idx !== i))} className="text-xs text-red-600">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setPricing([...pricing, { category_code: "non_member", fee: 0 }])} className="text-xs text-primary">+ Add tier</button>
      </div>

      <button disabled={submitting} className="bg-primary text-white px-4 py-2 rounded text-sm">
        {submitting ? "Saving..." : "Save Event"}
      </button>
    </form>
  );
}
