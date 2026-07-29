"use client";
import { useCallback, useRef, useState } from "react";
import {
  MdCheckCircle,
  MdErrorOutline,
  MdKeyboard,
  MdQrCodeScanner,
  MdVideocam,
  MdVideocamOff,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import QrScanner from "@/components/events/QrScanner";
import { useEvents } from "@/hooks/use-events";
import { useAgendas } from "@/hooks/use-agendas";
import {
  useAttendanceLookup,
  useAttendanceScan,
} from "@/hooks/use-event-operations";
import { extractTicketNumber } from "@/lib/ticket-code";
import { extractApiError } from "@/lib/extract-api-error";
import type { AttendanceType } from "@/types/nnak";

const SCAN_TYPES: AttendanceType[] = ["arrival", "session", "departure"];

interface ScanOutcome {
  ok: boolean;
  ticket: string;
  title: string;
  detail?: string;
  at: number;
}

const fmtTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/** Short tone so the person on the door does not have to watch the screen. */
const beep = (ok: boolean) => {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.3));
    osc.onended = () => ctx.close();
  } catch {
    // Audio is a nicety — a blocked AudioContext must not break scanning.
  }
};

export default function CheckInPage() {
  const [eventId, setEventId] = useState("");
  const [ticket, setTicket] = useState("");
  const [type, setType] = useState<AttendanceType>("arrival");
  const [agendaId, setAgendaId] = useState("");
  // Only looked up after a scan, so typing doesn't spam the API.
  const [lookupTicket, setLookupTicket] = useState("");

  const [cameraOn, setCameraOn] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [recent, setRecent] = useState<ScanOutcome[]>([]);
  // Blocks the decoder while a scan is in flight and during the result pause,
  // so one badge held up to the lens is not submitted repeatedly.
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const { data: eventsData } = useEvents({ per_page: 100 });
  const events = eventsData?.data ?? [];

  // Sessions are only meaningful for session scans.
  const { data: agendasData } = useAgendas(eventId);
  const agendas = agendasData?.data ?? [];

  const lookup = useAttendanceLookup(eventId, lookupTicket);
  const scan = useAttendanceScan();

  const record = useCallback(
    async (ticketNumber: string) => {
      const clean = ticketNumber.trim();
      if (!eventId || !clean || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const r = await scan.mutateAsync({
          eventId,
          ticket_number: clean,
          type,
          agenda_id: type === "session" && agendaId ? agendaId : undefined,
        });
        const result: ScanOutcome = {
          ok: true,
          ticket: r.ticket_number,
          title: r.name,
          detail: `${r.type} recorded${
            r.scanned_at ? ` at ${fmtTime(r.scanned_at)}` : ""
          }`,
          at: Date.now(),
        };
        beep(true);
        setOutcome(result);
        setRecent((prev) => [result, ...prev].slice(0, 12));
        setLookupTicket(r.ticket_number);
        setTicket("");
      } catch (e) {
        const result: ScanOutcome = {
          ok: false,
          ticket: clean,
          title: extractApiError(e, "Scan failed"),
          detail: clean,
          at: Date.now(),
        };
        beep(false);
        setOutcome(result);
        setRecent((prev) => [result, ...prev].slice(0, 12));
      } finally {
        // Hold the camera long enough for the badge to be taken away.
        setTimeout(() => {
          busyRef.current = false;
          setBusy(false);
        }, 1200);
      }
    },
    [agendaId, eventId, scan, type],
  );

  const onDecode = useCallback(
    (raw: string) => {
      const code = extractTicketNumber(raw);
      if (code) record(code);
    },
    [record],
  );

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    record(ticket);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Event Check-In"
        description="Scan a ticket QR code, or type the ticket number, to record attendance"
        action={
          <button
            type="button"
            onClick={() => setCameraOn((v) => !v)}
            disabled={!eventId}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 ${
              cameraOn
                ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {cameraOn ? (
              <>
                <MdVideocamOff className="w-4 h-4" /> Stop camera
              </>
            ) : (
              <>
                <MdVideocam className="w-4 h-4" /> Start scanning
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* Scan setup + camera */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Event</label>
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setAgendaId("");
                setLookupTicket("");
                setOutcome(null);
                setRecent([]);
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
            <label className="text-xs text-slate-500 block mb-1">
              Scan type
            </label>
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

          {/* Camera. Scanning stays paused between reads so a badge held in
              frame is recorded once. */}
          {cameraOn && eventId ? (
            <QrScanner onDecode={onDecode} paused={busy} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <MdQrCodeScanner className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                {eventId
                  ? "Start the camera to scan ticket QR codes."
                  : "Pick an event to begin."}
              </p>
            </div>
          )}

          {/* Manual fallback for damaged or unreadable badges. */}
          <form onSubmit={submitManual} className="space-y-2 pt-1">
            <label className="text-xs text-slate-500 flex items-center gap-1">
              <MdKeyboard className="w-4 h-4" /> Ticket number
            </label>
            <div className="flex gap-1.5">
              <input
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="TKT-CONF2026-ABC123"
                className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
              />
              <button
                disabled={scan.isPending || !eventId || !ticket.trim()}
                className="shrink-0 bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
              >
                {scan.isPending ? "Recording…" : "Record"}
              </button>
            </div>
          </form>
        </div>

        {/* Result + history */}
        <div className="space-y-3">
          {outcome && (
            <div
              className={`rounded-lg border p-4 flex items-start gap-3 ${
                outcome.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {outcome.ok ? (
                <MdCheckCircle className="w-6 h-6 shrink-0" />
              ) : (
                <MdErrorOutline className="w-6 h-6 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-semibold text-base truncate">
                  {outcome.title}
                </div>
                <div className="text-xs capitalize">{outcome.detail}</div>
                <div className="text-[11px] font-mono opacity-70 mt-0.5">
                  {outcome.ticket}
                </div>
              </div>
            </div>
          )}

          {/* Scan history for the last ticket, so duplicates are visible. */}
          {lookupTicket && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
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
                      {lookup.data.already_scanned
                        ? "Seen before"
                        : "First scan"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {lookup.data.package && (
                      <>Package: {lookup.data.package} · </>
                    )}
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

          {/* This device's run — the full record lives on the event's
              attendance tab. */}
          {recent.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
                Scanned on this device ({recent.length})
              </div>
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li
                    key={`${r.ticket}-${r.at}`}
                    className="px-4 py-2 flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span
                        className={`font-medium ${
                          r.ok ? "text-slate-900" : "text-red-700"
                        }`}
                      >
                        {r.title}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400">
                        {r.ticket}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(r.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
