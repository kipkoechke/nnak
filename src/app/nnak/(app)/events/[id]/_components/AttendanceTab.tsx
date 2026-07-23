"use client";
import { useState } from "react";
import {
  MdCheckCircle,
  MdErrorOutline,
  MdHowToReg,
  MdQrCodeScanner,
  MdSearch,
} from "react-icons/md";
import {
  useAttendanceLookup,
  useAttendanceReport,
  useAttendanceScan,
} from "@/hooks/use-event-operations";
import { useAgendas } from "@/hooks/use-agendas";
import type { AttendanceRecord, AttendanceType } from "@/types/nnak";
import type { Column } from "./shared";
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Row,
  SectionHeader,
  Select,
  SkeletonList,
  StatTile,
  Toolbar,
  fmtDateTime,
  fmtTime,
} from "./shared";

const TYPES: AttendanceType[] = ["arrival", "session", "departure"];

export default function AttendanceTab({ eventId }: { eventId: string }) {
  const [typeFilter, setTypeFilter] = useState<"" | AttendanceType>("");
  const [agendaFilter, setAgendaFilter] = useState("");

  const { data: report, isLoading } = useAttendanceReport(eventId, {
    type: typeFilter || undefined,
    agenda_id: agendaFilter || undefined,
  });
  const { data: agendasData } = useAgendas(eventId);
  const agendas = agendasData?.data ?? [];

  const records = report?.data ?? [];
  // `meta.stats` counts every page; falling back to the current page would
  // understate turnout as soon as there is more than one.
  const stats = report?.stats;
  const totalScans = stats?.total_scans ?? report?.pagination?.total ?? records.length;
  const uniqueAttendees =
    stats?.unique_attendees ??
    new Set(records.map((r) => r.ticket_number)).size;
  const byType = Object.entries(stats?.by_type ?? {}).filter(([, n]) => !!n);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">
            {a.attendee_name}
          </div>
          {a.email && (
            <div className="text-xs text-slate-500 truncate">{a.email}</div>
          )}
        </div>
      ),
    },
    {
      key: "ticket",
      header: "Ticket",
      className: "font-mono text-xs text-slate-600",
      render: (a) => a.ticket_number || "—",
    },
    {
      key: "type",
      header: "Type",
      render: (a) => <Badge tone="blue">{a.type}</Badge>,
    },
    {
      key: "session",
      header: "Session",
      className: "text-slate-600",
      render: (a) => a.agenda || "Whole event",
    },
    {
      key: "scanned",
      header: "Scanned",
      render: (a) => (
        <div>
          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
            <MdCheckCircle className="w-4 h-4" />
            {fmtTime(a.scanned_at)}
          </span>
          {a.scanned_by && (
            <div className="text-[11px] text-slate-400">by {a.scanned_by}</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Attendance"
        description="Check tickets at the door, record scans and track turnout"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <ScanConsole eventId={eventId} agendas={agendas} />

        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Scans recorded"
              value={totalScans}
              hint={
                byType.length
                  ? byType
                      .map(([type, n]) => `${n} ${type}`)
                      .join(" · ")
                  : undefined
              }
            />
            <StatTile
              label="Unique attendees"
              value={uniqueAttendees}
              tone="ok"
              hint="Across the whole event"
            />
          </div>

          <Toolbar>
            <Select
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as "" | AttendanceType)}
              className="w-full md:w-44"
            >
              <option value="">All scan types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              value={agendaFilter}
              onChange={setAgendaFilter}
              className="w-full md:w-64"
            >
              <option value="">All sessions</option>
              {agendas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </Select>
          </Toolbar>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : records.length === 0 ? (
        <EmptyState
          icon={MdHowToReg}
          title="No attendance data yet"
          description="Once tickets are scanned, turnout details show up here."
        />
      ) : (
        <DataTable columns={columns} rows={records} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Scan console — lookup before commit
 * ────────────────────────────────────────────────────────────────────── */

function ScanConsole({
  eventId,
  agendas,
}: {
  eventId: string;
  agendas: Array<{ id: string; title: string }>;
}) {
  const scan = useAttendanceScan();
  const [ticket, setTicket] = useState("");
  const [type, setType] = useState<AttendanceType>("arrival");
  const [agendaId, setAgendaId] = useState("");
  const [last, setLast] = useState<string | null>(null);

  // Only queried once the desk explicitly asks, so typing stays cheap.
  const [lookupTicket, setLookupTicket] = useState("");
  const {
    data: lookup,
    isFetching: looking,
    isError: lookupFailed,
  } = useAttendanceLookup(eventId, lookupTicket);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.trim()) return;
    const r = await scan
      .mutateAsync({
        eventId,
        ticket_number: ticket.trim(),
        type,
        agenda_id: type === "session" && agendaId ? agendaId : undefined,
      })
      .catch(() => null);
    if (r) {
      setLast(`${r.name} — ${r.type} at ${fmtTime(r.scanned_at)}`);
      setTicket("");
      setLookupTicket("");
    }
  };

  return (
    <Card className="lg:col-span-1 space-y-3">
      <div className="flex items-center gap-2">
        <MdQrCodeScanner className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-slate-900">
          Door check-in
        </h4>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Ticket number
          </label>
          <div className="flex gap-1.5">
            <input
              value={ticket}
              onChange={(e) => {
                setTicket(e.target.value);
                setLookupTicket("");
              }}
              placeholder="TKT-…"
              autoFocus
              className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              disabled={!ticket.trim() || looking}
              onClick={() => setLookupTicket(ticket.trim())}
              title="Check this ticket without recording a scan"
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <MdSearch className="w-4 h-4" />
              Check
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Check first to see who it belongs to without recording anything.
          </p>
        </div>

        {lookupTicket && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {looking ? (
              <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ) : lookupFailed || !lookup ? (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <MdErrorOutline className="w-4 h-4 shrink-0" />
                No attendee holds that ticket.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {lookup.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {[lookup.email, lookup.phone].filter(Boolean).join(" · ") ||
                        "No contact on file"}
                    </div>
                  </div>
                  <Badge tone={lookup.already_scanned ? "amber" : "emerald"}>
                    {lookup.already_scanned ? "Already in" : "First scan"}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Row label="Package" value={lookup.package || "—"} />
                  <Row label="Source" value={lookup.source || "—"} cap />
                  {lookup.type && <Row label="Type" value={lookup.type} cap />}
                </div>

                {lookup.attendances.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      Previous scans
                    </div>
                    <ul className="space-y-1">
                      {lookup.attendances.map((a, i) => (
                        <li
                          key={`${a.scanned_at}-${i}`}
                          className="text-xs text-slate-600 flex items-center justify-between gap-2"
                        >
                          <span className="capitalize truncate">
                            {a.type}
                            {a.agenda ? ` · ${a.agenda}` : ""}
                          </span>
                          <span className="text-slate-400 shrink-0 tabular-nums">
                            {fmtDateTime(a.scanned_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Select
          label="Scan type"
          value={type}
          onChange={(v) => setType(v as AttendanceType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        {type === "session" && (
          <Select label="Session" value={agendaId} onChange={setAgendaId}>
            <option value="">Whole event</option>
            {agendas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </Select>
        )}

        <button
          type="submit"
          disabled={scan.isPending || !ticket.trim()}
          className="w-full bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {scan.isPending ? "Recording…" : "Record scan"}
        </button>

        {last && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <MdCheckCircle className="w-4 h-4 shrink-0" /> {last}
          </div>
        )}
      </form>
    </Card>
  );
}
