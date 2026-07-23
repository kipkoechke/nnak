"use client";
import { useState } from "react";
import type { CreateEventInput, NnakEvent } from "@/types/nnak";

interface Props {
  initial?: Partial<NnakEvent>;
  onSubmit: (
    data: Partial<NnakEvent> & Partial<CreateEventInput>,
  ) => Promise<void> | void;
  submitting?: boolean;
}

/** The API stores dates as YYYY-MM-DD; trim anything longer for the inputs. */
const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : "");

export default function EventForm({ initial, onSubmit, submitting }: Props) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    code: initial?.code || "",
    theme: initial?.theme || "",
    description: initial?.description || "",
    type: initial?.type || "conference",
    is_approved: initial?.is_approved ?? false,
    start_date: toDateInput(initial?.start_date),
    end_date: toDateInput(initial?.end_date),
    location: initial?.location || "",
    lat: initial?.location_coordinates?.lat?.toString() ?? "",
    lng: initial?.location_coordinates?.lng?.toString() ?? "",
    cover_image_url: initial?.cover_image_url || "",
    banner_image_url: initial?.banner_image_url || "",
    metadata: initial?.metadata ? JSON.stringify(initial.metadata, null, 2) : "",
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.end_date < form.start_date) {
      setError("End date must be on or after the start date.");
      return;
    }

    let metadata: Record<string, unknown> | null = null;
    if (form.metadata.trim()) {
      try {
        metadata = JSON.parse(form.metadata);
      } catch {
        setError("Metadata must be valid JSON.");
        return;
      }
    }

    const hasCoords = form.lat.trim() !== "" && form.lng.trim() !== "";

    await onSubmit({
      ...(initial?.id ? { id: initial.id } : {}),
      code: form.code,
      title: form.title,
      theme: form.theme || null,
      description: form.description || null,
      type: form.type || null,
      is_approved: form.is_approved,
      start_date: form.start_date,
      end_date: form.end_date,
      location: form.location || null,
      location_coordinates: hasCoords
        ? { lat: Number(form.lat), lng: Number(form.lng) }
        : null,
      cover_image_url: form.cover_image_url || null,
      banner_image_url: form.banner_image_url || null,
      metadata,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 max-w-3xl"
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Event code (e.g. CONF-2026)"
          maxLength={50}
          required
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Event title"
          maxLength={255}
          required
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      </div>
      <input
        value={form.theme}
        onChange={(e) => setForm({ ...form, theme: e.target.value })}
        placeholder="Theme"
        maxLength={500}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        rows={3}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          list="event-types"
          placeholder="Type (e.g. conference)"
          maxLength={50}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <datalist id="event-types">
          {["conference", "workshop", "cpd", "agm", "training"].map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-sm">
          <input
            type="checkbox"
            checked={form.is_approved}
            onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
            className="rounded border-slate-300"
          />
          Approved (bookable)
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            End Date
          </label>
          <input
            type="date"
            value={form.end_date}
            min={form.start_date || undefined}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
      </div>
      <input
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        placeholder="Location (e.g. KICC, Nairobi)"
        maxLength={255}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.lat}
          onChange={(e) => setForm({ ...form, lat: e.target.value })}
          placeholder="Latitude (e.g. -1.2921)"
          inputMode="decimal"
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <input
          value={form.lng}
          onChange={(e) => setForm({ ...form, lng: e.target.value })}
          placeholder="Longitude (e.g. 36.8219)"
          inputMode="decimal"
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.cover_image_url}
          onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
          placeholder="Cover image URL"
          maxLength={500}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
        <input
          value={form.banner_image_url}
          onChange={(e) =>
            setForm({ ...form, banner_image_url: e.target.value })
          }
          placeholder="Banner image URL"
          maxLength={500}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="text-[11px] text-slate-500 block mb-1">
          Metadata (JSON, optional)
        </label>
        <textarea
          value={form.metadata}
          onChange={(e) => setForm({ ...form, metadata: e.target.value })}
          rows={3}
          placeholder='{"hashtag": "#NNAK2026"}'
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
        />
      </div>

      {error && (
        <div className="text-xs rounded-md px-3 py-2 bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <button
        disabled={submitting}
        className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save Event"}
      </button>
    </form>
  );
}
