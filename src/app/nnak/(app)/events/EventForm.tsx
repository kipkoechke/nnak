"use client";
import { useState } from "react";
import type { CreateEventInput, EventType, NnakEvent } from "@/types/nnak";

interface Props {
  initial?: Partial<NnakEvent>;
  onSubmit: (data: Partial<NnakEvent & CreateEventInput>) => Promise<void> | void;
  submitting?: boolean;
}

export default function EventForm({ initial, onSubmit, submitting }: Props) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    code: initial?.code || "",
    theme: initial?.theme || "",
    description: initial?.description || "",
    type: (initial?.type as EventType) || "cpd",
    status: initial?.status || "draft",
    start_date: initial?.start_date?.slice(0, 16) || "",
    end_date: initial?.end_date?.slice(0, 16) || "",
    location: initial?.location || "",
    cover_image_url: initial?.cover_image_url || "",
    banner_image_url: initial?.banner_image_url || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      ...(initial?.id ? { id: initial.id } : {}),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
    });
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 max-w-3xl">
      <div className="grid grid-cols-2 gap-2">
        <input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder="Event code (e.g. NNC-2026)" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
        <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Event title" required className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
      </div>
      <input value={form.theme} onChange={(e) => setForm({...form, theme: e.target.value})} placeholder="Theme" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value as EventType})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          {["conference","workshop","cpd","agm","training"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as NnakEvent["status"]})} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          {["draft","published","closed","completed","cancelled"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Start Date</label>
          <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">End Date</label>
          <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
        </div>
      </div>
      <input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="Location (e.g. KICC, Nairobi)" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.cover_image_url} onChange={(e) => setForm({...form, cover_image_url: e.target.value})} placeholder="Cover image URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
        <input value={form.banner_image_url} onChange={(e) => setForm({...form, banner_image_url: e.target.value})} placeholder="Banner image URL" className="px-3 py-2 border border-slate-300 rounded-md text-sm" />
      </div>

      <button disabled={submitting} className="bg-primary text-white px-4 py-2 rounded text-sm">
        {submitting ? "Saving..." : "Save Event"}
      </button>
    </form>
  );
}
