"use client";
import { useState } from "react";
import {
  MdCheckCircle,
  MdConfirmationNumber,
  MdReceiptLong,
} from "react-icons/md";
import { useEventBooking, useEventBookings } from "@/hooks/use-event-operations";
import { eventBookingService } from "@/services/event-booking.service";
import DownloadButton from "@/components/common/DownloadButton";
import { collectAllPages, type ExcelColumn } from "@/lib/export-excel";
import type { BookingStatus, EventBooking } from "@/types/nnak";
import type { Column } from "./shared";
import {
  Badge,
  DataTable,
  Drawer,
  EmptyState,
  FilterPills,
  Row,
  SearchInput,
  SectionHeader,
  SkeletonList,
  Toolbar,
  fmtDateTime,
  fmtMoney,
  fmtTime,
} from "./shared";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export const statusTone = (s?: BookingStatus | string | null) => {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "emerald" as const;
  if (v === "pending_payment") return "amber" as const;
  if (v === "cancelled" || v === "expired") return "red" as const;
  return "slate" as const;
};

const humanise = (s?: string | null) => String(s ?? "—").replace(/_/g, " ");

export default function BookingsTab({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useEventBookings(eventId, {
    status: status || undefined,
    search: search.trim() || undefined,
  });

  const bookings = data?.data ?? [];

  const exportColumns: ExcelColumn<EventBooking>[] = [
    { header: "Reference", value: (b) => b.reference_code },
    { header: "Booker", value: (b) => b.contact_name || b.user?.name || "" },
    { header: "Email", value: (b) => b.contact_email || b.user?.email || "" },
    { header: "Phone", value: (b) => b.contact_phone ?? "" },
    { header: "Package", value: (b) => b.package_name ?? "" },
    { header: "Attendees", value: (b) => b.attendees_count ?? 0 },
    { header: "Amount", value: (b) => Number(b.total_amount ?? 0) },
    { header: "Status", value: (b) => humanise(b.status) },
    { header: "Invoice", value: (b) => b.invoice_status ?? "" },
    { header: "Booked At", value: (b) => fmtDateTime(b.created_at) },
  ];

  const fetchExportRows = () =>
    collectAllPages<EventBooking>((p) =>
      eventBookingService.list("admin", eventId, {
        page: p,
        per_page: 100,
        status: status || undefined,
        search: search.trim() || undefined,
      }),
    );

  const columns: Column<EventBooking>[] = [
    {
      key: "reference",
      header: "Reference",
      className: "font-mono text-xs text-slate-700",
      render: (b) => b.reference_code,
    },
    {
      key: "booker",
      header: "Booker",
      render: (b) => (
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">
            {b.contact_name || b.user?.name || "—"}
          </div>
          {(b.contact_email || b.user?.email) && (
            <div className="text-xs text-slate-500 truncate">
              {b.contact_email || b.user?.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "package",
      header: "Package",
      className: "text-slate-600",
      render: (b) => b.package_name || "—",
    },
    {
      key: "attendees",
      header: "Pax",
      align: "right",
      className: "tabular-nums",
      render: (b) => b.attendees_count ?? "—",
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      className: "tabular-nums text-slate-900 font-medium",
      render: (b) => fmtMoney(b.total_amount),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => <Badge tone={statusTone(b.status)}>{humanise(b.status)}</Badge>,
    },
    {
      key: "invoice",
      header: "Invoice",
      className: "text-xs text-slate-600 capitalize",
      render: (b) => b.invoice_status || "—",
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Bookings"
        description="Every booking placed for this event — open a row for invoice and ticket detail"
        count={data?.pagination?.total ?? bookings.length}
        action={
          <DownloadButton
            filename="event-bookings"
            sheetName="Bookings"
            columns={exportColumns}
            fetchRows={fetchExportRows}
          />
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search reference, name or email…"
          className="flex-1 max-w-md"
        />
        <FilterPills
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </Toolbar>

      {isLoading ? (
        <SkeletonList />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={MdReceiptLong}
          title={search || status ? "No bookings match" : "No bookings yet"}
          description={
            search || status
              ? "Try a different search term or clear the status filter."
              : "Bookings appear here once members or the public book a package."
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={bookings}
          onRowClick={(b) => setOpenId(b.id)}
        />
      )}

      <BookingDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Detail drawer — GET /admin/bookings/{booking}
 * ────────────────────────────────────────────────────────────────────── */

function BookingDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data: booking, isLoading } = useEventBooking(id ?? undefined);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={booking?.reference_code ?? "Booking"}
      subtitle={booking ? fmtDateTime(booking.created_at) : undefined}
    >
      {isLoading || !booking ? (
        <div className="space-y-3">
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <Badge tone={statusTone(booking.status)}>
              {humanise(booking.status)}
            </Badge>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {fmtMoney(booking.total_amount)}
            </span>
          </div>

          <section>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Booker
            </h4>
            <div className="space-y-2 bg-slate-50 rounded-xl p-3">
              <Row label="Name" value={booking.contact_name || booking.user?.name || "—"} />
              <Row
                label="Email"
                value={booking.contact_email || booking.user?.email || "—"}
              />
              <Row label="Phone" value={booking.contact_phone || "—"} />
              <Row label="Package" value={booking.package_name || "—"} />
            </div>
          </section>

          {booking.invoice && (
            <section>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Invoice
              </h4>
              <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                <Row label="Number" value={booking.invoice.invoice_number} mono />
                <Row label="Amount" value={fmtMoney(booking.invoice.amount)} />
                <Row
                  label="Status"
                  value={booking.invoice.status || "—"}
                  cap
                />
                {booking.invoice.due_date && (
                  <Row label="Due" value={fmtDateTime(booking.invoice.due_date)} />
                )}
                <Row
                  label="Paid"
                  value={
                    booking.invoice.paid_at
                      ? fmtDateTime(booking.invoice.paid_at)
                      : "Not paid"
                  }
                />
              </div>
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Attendees{" "}
              <span className="text-slate-400 font-normal">
                {booking.attendees?.length ?? 0}
              </span>
            </h4>
            {!booking.attendees?.length ? (
              <p className="text-sm text-slate-500">
                No attendees on this booking.
              </p>
            ) : (
              <div className="space-y-2">
                {booking.attendees.map((a) => (
                  <div
                    key={a.id}
                    className="border border-slate-200 rounded-xl p-3"
                  >
                    <div className="font-medium text-slate-900">{a.name}</div>
                    {(a.email || a.phone) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {[a.email, a.phone].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {a.ticket_number ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          <MdConfirmationNumber className="w-3 h-3" />
                          {a.ticket_number}
                        </span>
                      ) : (
                        <Badge>No ticket</Badge>
                      )}
                      {a.ticket_sent_at && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <MdCheckCircle className="w-3.5 h-3.5" />
                          Sent {fmtTime(a.ticket_sent_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
