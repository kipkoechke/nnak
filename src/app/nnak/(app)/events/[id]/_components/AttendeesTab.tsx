"use client";
import { useMemo, useState } from "react";
import { MdCheckCircle, MdConfirmationNumber } from "react-icons/md";
import {
  useCreateEventAttendee,
  useEventAttendees,
} from "@/hooks/use-event-operations";
import { useEventPackages } from "@/hooks/use-event-packages";
import { eventAttendeeService } from "@/services/event-attendee.service";
import DownloadButton from "@/components/common/DownloadButton";
import { collectAllPages, type ExcelColumn } from "@/lib/export-excel";
import type { AttendeeType, EventAttendee } from "@/types/nnak";
import type { Column } from "./shared";
import {
  AddBtn,
  Badge,
  DataTable,
  EmptyState,
  Field,
  FilterPills,
  FormActions,
  Modal,
  SearchInput,
  SectionHeader,
  Select,
  SkeletonList,
  StatTile,
  Toggle,
  Toolbar,
  fmtTime,
} from "./shared";

const ATTENDEE_TYPES: AttendeeType[] = [
  "vip",
  "sponsor",
  "staff",
  "speaker",
  "other",
];

const TICKET_FILTERS = [
  { value: "", label: "All" },
  { value: "issued", label: "Ticket issued" },
  { value: "sent", label: "Ticket sent" },
  { value: "missing", label: "No ticket" },
] as const;

type TicketFilter = (typeof TICKET_FILTERS)[number]["value"];

const empty = {
  name: "",
  email: "",
  phone: "",
  type: "vip" as AttendeeType,
  reason: "",
  send_ticket: true,
};

export default function AttendeesTab({ eventId }: { eventId: string }) {
  const [search, setSearch] = useState("");
  const [ticket, setTicket] = useState<TicketFilter>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEventAttendees(eventId, {
    page,
    search: search.trim() || undefined,
  });
  const createAttendee = useCreateEventAttendee();
  const { data: packagesData } = useEventPackages(eventId);
  const packages = packagesData?.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [packageId, setPackageId] = useState("");

  const attendees = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  // The API has no ticket filter, so this narrows the page already fetched.
  const rows = useMemo(() => {
    if (!ticket) return attendees;
    return attendees.filter((a) => {
      if (ticket === "issued") return !!a.ticket_number;
      if (ticket === "sent") return !!a.ticket_sent_at;
      return !a.ticket_number;
    });
  }, [attendees, ticket]);

  const reset = () => {
    setForm(empty);
    setPackageId("");
    setModalOpen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createAttendee.mutate(
      {
        eventId,
        input: {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          type: form.type,
          reason: form.reason || null,
          event_package_id: packageId || null,
          send_ticket: form.send_ticket,
        },
      },
      { onSuccess: reset },
    );
  };

  const columns: Column<EventAttendee>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">{a.name}</div>
          {a.reason && (
            <div className="text-[11px] text-slate-400 truncate">{a.reason}</div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      className: "text-slate-600",
      render: (a) => (
        <div className="min-w-0">
          <div className="truncate">{a.email || "—"}</div>
          {a.phone && (
            <div className="text-xs text-slate-400 truncate">{a.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (a) => <Badge>{a.type || "booked"}</Badge>,
    },
    {
      key: "source",
      header: "Source",
      className: "text-xs text-slate-600",
      render: (a) => (
        <div className="min-w-0">
          <div className="capitalize">{a.source || "—"}</div>
          {a.booking_reference && (
            <div className="font-mono text-slate-400 truncate">
              {a.booking_reference}
            </div>
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
      key: "sent",
      header: "Ticket sent",
      render: (a) =>
        a.ticket_sent_at ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
            <MdCheckCircle className="w-4 h-4" />
            {fmtTime(a.ticket_sent_at)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  const exportColumns: ExcelColumn<EventAttendee>[] = [
    { header: "Name", value: (a) => a.name },
    { header: "Email", value: (a) => a.email ?? "" },
    { header: "Phone", value: (a) => a.phone ?? "" },
    { header: "Type", value: (a) => a.type ?? "booked" },
    { header: "Source", value: (a) => a.source ?? "" },
    { header: "Booking Ref", value: (a) => a.booking_reference ?? "" },
    { header: "Package", value: (a) => a.package_name ?? "" },
    { header: "Ticket No.", value: (a) => a.ticket_number ?? "" },
    { header: "Ticket Sent", value: (a) => a.ticket_sent_at ?? "" },
  ];

  const fetchExportRows = () =>
    collectAllPages<EventAttendee>((p) =>
      eventAttendeeService
        .list("admin", eventId, {
          page: p,
          per_page: 100,
          search: search.trim() || undefined,
        })
        // The attendees endpoint paginates inside `meta`, not `pagination`.
        .then((r) => ({ data: r.data, pagination: r.meta })),
    );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Attendees"
        description="Booked attendees plus manually-added VIPs, staff and guests"
        count={meta?.total ?? attendees.length}
        action={
          <div className="flex items-center gap-2">
            <DownloadButton
              filename="event-attendees"
              sheetName="Attendees"
              columns={exportColumns}
              fetchRows={fetchExportRows}
            />
            <AddBtn onClick={() => setModalOpen(true)} label="Add attendee" />
          </div>
        }
      />

      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatTile label="Attendees" value={meta.total} />
          <StatTile label="Scanned in" value={meta.scanned_in} tone="ok" />
          <StatTile
            label="Turnout"
            value={
              meta.total
                ? `${Math.round((meta.scanned_in / meta.total) * 100)}%`
                : "—"
            }
            hint="Scanned at least once"
          />
        </div>
      )}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search attendees…"
          className="flex-1 max-w-md"
        />
        <FilterPills
          options={TICKET_FILTERS}
          value={ticket}
          onChange={setTicket}
        />
      </Toolbar>

      {isLoading ? (
        <SkeletonList />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MdConfirmationNumber}
          title={
            search || ticket ? "No attendees match" : "No attendees yet"
          }
          description={
            search || ticket
              ? "Try a different search term or clear the ticket filter."
              : "Add VIPs, staff or guests here, or wait for bookings to come in."
          }
          action={
            !search && !ticket ? (
              <AddBtn onClick={() => setModalOpen(true)} label="Add an attendee" />
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title="Add attendee"
        description="For guests who are not coming through a booking."
      >
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type"
              required
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v as AttendeeType })}
            >
              {ATTENDEE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              label="Package (optional)"
              value={packageId}
              onChange={setPackageId}
            >
              <option value="">— None —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <Field
            label="Reason (optional)"
            value={form.reason}
            onChange={(v) => setForm({ ...form, reason: v })}
            placeholder="e.g. Keynote speaker's guest"
          />
          <Toggle
            label="Email the ticket now"
            checked={form.send_ticket}
            onChange={(v) => setForm({ ...form, send_ticket: v })}
          />
          <FormActions
            onCancel={reset}
            saving={createAttendee.isPending}
            submitLabel="Add attendee"
          />
        </form>
      </Modal>
    </div>
  );
}
