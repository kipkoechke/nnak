"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useEvents } from "@/hooks/use-events";
import { useAgendas } from "@/hooks/use-agendas";
import {
  useAttendanceLookup,
  useAttendanceScan,
} from "@/hooks/use-event-operations";
import type { AttendanceType } from "@/types/nnak";

const SCAN_TYPES: AttendanceType[] = ["arrival", "session", "departure"];

export default function CheckInPage() {
  const [eventId, setEventId] = useState("");
  const [ticket, setTicket] = useState("");
  const [type, setType] = useState<AttendanceType>("arrival");
  const [agendaId, setAgendaId] = useState("");
  // Only looked up after a scan, so typing doesn't spam the API.
  const [lookupTicket, setLookupTicket] = useState("");

  const { data: eventsData } = useEvents({ per_page: 100 });
  const events = eventsData?.data ?? [];

  // Sessions are only meaningful for session scans.
  const { data: agendasData } = useAgendas(eventId);
  const agendas = agendasData?.data ?? [];

  const lookup = useAttendanceLookup(eventId, lookupTicket);
  const scan = useAttendanceScan();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !ticket.trim()) return;
    const r = await scan
      .mutateAsync({
        eventId,
        ticket_number: ticket.trim(),
        type,
        agenda_id: type === "session" && agendaId ? agendaId : undefined,
      })
      .catch(() => null);
    if (r) {
      setLookupTicket(r.ticket_number);
      setTicket("");
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Event Check-In"
        description="Scan or enter a ticket number to record attendance"
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-lg p-4 max-w-md space-y-3"
      >
        <div>
          <label className="text-xs text-slate-500 block mb-1">Event</label>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setAgendaId("");
              setLookupTicket("");
            }}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Scan type</label>
          <div className="flex gap-1.5">
            {SCAN_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                  type === t
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {type === "session" && (
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Session (optional)
            </label>
            <select
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Whole event</option>
              {agendas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Ticket number
          </label>
          <input
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            required
            autoFocus
            placeholder="TKT-CONF2026-ABC123"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
          />
        </div>

        <button
          disabled={scan.isPending || !eventId}
          className="w-full bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {scan.isPending ? "Recording…" : "Record attendance"}
        </button>
      </form>

      {/* Scan history for the last ticket, so duplicates are visible. */}
      {lookupTicket && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-md space-y-2">
          {lookup.isLoading ? (
            <div className="text-xs text-slate-500">Loading attendee…</div>
          ) : lookup.isError || !lookup.data ? (
            <div className="text-xs text-red-600">
              No attendee found for {lookupTicket}.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">
                    {lookup.data.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {[lookup.data.email, lookup.data.phone]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    lookup.data.already_scanned
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {lookup.data.already_scanned ? "Seen before" : "First scan"}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {lookup.data.package && <>Package: {lookup.data.package} · </>}
                Source: {lookup.data.source ?? "—"}
              </div>
              {lookup.data.attendances.length > 0 && (
                <ul className="text-xs text-slate-600 divide-y divide-slate-100">
                  {lookup.data.attendances.map((a, i) => (
                    <li key={i} className="py-1 flex justify-between gap-2">
                      <span className="capitalize">
                        {a.type}
                        {a.agenda ? ` · ${a.agenda}` : ""}
                      </span>
                      <span className="text-slate-400">
                        {new Date(a.scanned_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
