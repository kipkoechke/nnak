"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import {
  useMyWorkstations,
  useCreateWorkstation,
  useUpdateWorkstation,
  useDeleteWorkstation,
} from "@/hooks/use-workstations";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { COUNTY_OPTIONS } from "@/lib/counties";
import type { Workstation, WorkstationInput } from "@/types/nnak";
import { MdEdit, MdDelete, MdAdd, MdClose } from "react-icons/md";

const todayIso = () => new Date().toISOString().slice(0, 10);

const empty: WorkstationInput = {
  name: "",
  country: "Kenya",
  city: "",
  start_date: todayIso(),
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function MyWorkstationsPage() {
  const { data: items = [], isLoading } = useMyWorkstations();
  const create = useCreateWorkstation();
  const update = useUpdateWorkstation();
  const remove = useDeleteWorkstation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Workstation | null>(null);
  const [form, setForm] = useState<WorkstationInput>(empty);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (w: Workstation) => {
    setEditing(w);
    setForm({
      name: w.name,
      country: w.country,
      city: w.city,
      start_date: w.start_date.slice(0, 10),
    });
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(empty);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: form });
    } else {
      await create.mutateAsync(form);
    }
    close();
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="My Workstations"
        description="Your employer history — past and current postings"
      />

      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
        >
          <MdAdd className="w-4 h-4" /> Transfer workstation
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Workstation</th>
              <th className="px-4 py-2 hidden md:table-cell">County</th>
              <th className="px-4 py-2 hidden md:table-cell">Country</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No workstations yet. Add your first one.</td></tr>
            ) : (
              items.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{w.name}</td>
                  <td className="px-4 py-2 text-slate-600 hidden md:table-cell">{w.city}</td>
                  <td className="px-4 py-2 text-slate-600 hidden md:table-cell">{w.country}</td>
                  <td className="px-4 py-2 text-slate-600">{fmt(w.start_date)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => openEdit(w)} className="text-slate-500 hover:text-primary p-1" title="Edit">
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirm(`Remove ${w.name}?`) && remove.mutate(w.id)}
                      className="text-slate-500 hover:text-red-600 p-1"
                      title="Remove"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-md space-y-3 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {editing ? "Edit workstation" : "Transfer workstation"}
              </h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-700">
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <div className="grid grid-cols-2 gap-2">
              <SearchableSelect
                label="County"
                required
                options={COUNTY_OPTIONS}
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                placeholder="Select county"
                searchPlaceholder="Search counties…"
              />
              <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
            </div>
            <Field
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(v) => setForm({ ...form, start_date: v })}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="px-3 py-2 border border-slate-300 rounded text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {create.isPending || update.isPending ? "Saving…" : editing ? "Save" : "Transfer"}
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
    {/* Matches SearchableSelect's label so fields line up side by side. */}
    <label className="block text-sm font-bold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);
