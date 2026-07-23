"use client";
import {
  MdCalendarToday,
  MdImage,
  MdLocationOn,
  MdOpenInNew,
} from "react-icons/md";
import { EventMap } from "@/components/common/EventMap";
import type { NnakEvent } from "@/types/nnak";
import { Card, Row, fmtDate, fmtDateTime, fmtRange } from "./shared";

export default function OverviewTab({ event }: { event: NnakEvent }) {
  const coords = event.location_coordinates;
  const metadata = Object.entries(event.metadata ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
      {/* ── Main column ── */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            About this event
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
            {event.description || "No description yet."}
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <MdCalendarToday className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">When</h3>
            </div>
            <div className="space-y-2">
              <Row label="Starts" value={fmtDate(event.start_date)} />
              <Row label="Ends" value={fmtDate(event.end_date)} />
              <Row label="Span" value={fmtRange(event.start_date, event.end_date)} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <MdLocationOn className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">Where</h3>
            </div>
            <div className="space-y-2">
              <Row label="Venue" value={event.location || "—"} />
              <Row
                label="Coordinates"
                value={
                  coords ? `${coords.lat}, ${coords.lng}` : "Not pinned"
                }
                mono={!!coords}
              />
              {coords && (
                <Row
                  label="Maps"
                  value={
                    <a
                      href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open <MdOpenInNew className="w-3 h-3" />
                    </a>
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {coords && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-1.5">
            {/* LeafletMap sets its own 240px height. */}
            <EventMap
              lat={coords.lat}
              lng={coords.lng}
              label={event.location || event.title}
            />
          </div>
        )}

        {metadata.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Metadata
            </h3>
            <div className="space-y-2">
              {metadata.map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Right rail ── */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Artwork</h3>
          <div className="space-y-3">
            <ImageSlot label="Cover" url={event.cover_image_url} />
            <ImageSlot label="Banner" url={event.banner_image_url} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Identifiers
          </h3>
          <div className="space-y-2">
            <Row label="Code" value={event.code} mono />
            <Row label="Type" value={event.type || "—"} cap />
            <Row
              label="Visibility"
              value={event.is_approved ? "Public" : "Hidden"}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Record history
          </h3>
          <div className="space-y-2">
            <Row label="Created" value={fmtDateTime(event.created_at)} />
            <Row label="Updated" value={fmtDateTime(event.updated_at)} />
            {event.created_by && (
              <Row label="Created by" value={event.created_by} mono />
            )}
            {event.updated_by && (
              <Row label="Updated by" value={event.updated_by} mono />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

const ImageSlot = ({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1.5">
      {label}
    </div>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="w-full h-28 object-cover rounded-lg border border-slate-200 group-hover:border-primary transition-colors"
        />
      </a>
    ) : (
      <div className="w-full h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400">
        <MdImage className="w-5 h-5" />
        <span className="text-[11px]">Not set</span>
      </div>
    )}
  </div>
);
