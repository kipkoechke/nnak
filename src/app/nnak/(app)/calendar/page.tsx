"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdEdit,
  MdEventNote,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { ModalShell } from "@/components/common/Modal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import {
  useCalendar,
  useCreateCalendarEntry,
  useDeleteCalendarEntry,
  useUpdateCalendarEntry,
} from "@/hooks/use-calendar";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import type { CalendarEntryType, CalendarItem } from "@/types/nnak";

const TYPES: CalendarEntryType[] = [
  "meeting",
  "activity",
  "holiday",
  "general",
];

const TYPE_TONE: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700",
  activity: "bg-emerald-100 text-emerald-700",
  holiday: "bg-amber-100 text-amber-800",
  general: "bg-slate-100 text-slate-700",
  event: "bg-primary/10 text-primary",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const fmtDay = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
    : "—";

const emptyForm = {
  title: "",
  type: "meeting" as CalendarEntryType,
  start_date: "",
  end_date: "",
  location: "",
  description: "",
  is_all_day: true,
};

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: me } = useNnakMe();
  // Reads are public; only staff who manage events get the CRUD controls.
  const canManage = nnakCan.manageEvents(me);

  const { data: items = [], isLoading } = useCalendar({ year, month });
  const createEntry = useCreateCalendarEntry();
  const updateEntry = useUpdateCalendarEntry();
  const deleteEntry = useDeleteCalendarEntry();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteFor, setDeleteFor] = useState<CalendarItem | null>(null);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      ),
    [items],
  );

  const step = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const openNew = () => {
    setEditId(null);
    setForm({
      ...emptyForm,
      // Default to the first of the month being viewed.
      start_date: `${year}-${String(month).padStart(2, "0")}-01`,
    });
    setShowForm(true);
  };

  const openEdit = (item: CalendarItem) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      type: (item.type as CalendarEntryType) ?? "meeting",
      start_date: item.start_date?.slice(0, 10) ?? "",
      end_date: item.end_date?.slice(0, 10) ?? "",
      location: item.location ?? "",
      description: item.description ?? "",
      is_all_day: item.is_all_day ?? true,
    });
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      title: form.title.trim(),
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      is_all_day: form.is_all_day,
    };
    const done = { onSuccess: () => setShowForm(false) };
    if (editId) updateEntry.mutate({ id: editId, input }, done);
    else createEntry.mutate(input, done);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Calendar"
        description="Meetings, activities and holidays, alongside approved events"
        action={
          canManage ? (
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
            >
              <MdAdd className="w-4 h-4" /> New entry
            </button>
          ) : undefined
        }
      />

      <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
          aria-label="Previous month"
        >
          <MdChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold text-slate-900">
          {MONTHS[month - 1]} {year}
        </div>
        <button
          onClick={() => step(1)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
          aria-label="Next month"
        >
          <MdChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-sm text-center text-slate-500">
            <MdEventNote className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            Nothing scheduled for {MONTHS[month - 1]}.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((item) => {
              const isEvent = item.source === "event";
              return (
                <li
                  key={`${item.source}-${item.id}`}
                  className="px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                          TYPE_TONE[isEvent ? "event" : item.type] ||
                          TYPE_TONE.general
                        }`}
                      >
                        {isEvent ? "event" : item.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtDay(item.start_date)}
                      {item.end_date && item.end_date !== item.start_date
                        ? ` – ${fmtDay(item.end_date)}`
                        : ""}
                      {item.location ? ` · ${item.location}` : ""}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Events are owned by the events module — link out rather
                      than offering edits that would not apply. */}
                  {isEvent ? (
                    <Link
                      href={`/nnak/events/${item.event_id ?? item.id}`}
                      className="text-xs text-primary font-medium hover:underline shrink-0"
                    >
                      Open event
                    </Link>
                  ) : (
                    canManage && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                          title="Edit entry"
                        >
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteFor(item)}
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                          title="Delete entry"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ModalShell isOpen={showForm} onClose={() => setShowForm(false)} size="lg">
        <form onSubmit={submit} className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {editId ? "Edit calendar entry" : "New calendar entry"}
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as CalendarEntryType })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm capitalize"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                End
              </label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_all_day}
              onChange={(e) =>
                setForm({ ...form, is_all_day: e.target.checked })
              }
              className="accent-primary"
            />
            All day
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEntry.isPending || updateEntry.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold disabled:opacity-50"
            >
              {editId ? "Save changes" : "Add entry"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell isOpen={!!deleteFor} onClose={() => setDeleteFor(null)}>
        <DeleteConfirmationModal
          itemName={deleteFor?.title ?? ""}
          itemType="calendar entry"
          isDeleting={deleteEntry.isPending}
          onConfirm={() => {
            if (deleteFor) deleteEntry.mutate(deleteFor.id);
          }}
          onCloseModal={() => setDeleteFor(null)}
        />
      </ModalShell>
    </div>
  );
}
