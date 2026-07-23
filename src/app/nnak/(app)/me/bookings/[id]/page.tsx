"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdCalendarToday, MdBookmarks, MdLocationOn, MdConfirmationNumber } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import {
  useBooking,
  useCancelBooking,
  usePayBooking,
} from "@/hooks/use-bookings";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function MyBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const payBooking = usePayBooking();
  const cancelBooking = useCancelBooking();
  const [payPhone, setPayPhone] = useState("");
  // Poll while an STK push is in flight so the status flips without a refresh.
  const { data: booking, isLoading } = useBooking(id, {
    poll: payBooking.isSuccess,
  });

  if (isLoading && !booking)
    return <div className="p-4 text-sm text-slate-500">Loading booking…</div>;
  if (!booking)
    return <div className="p-4 text-sm text-slate-500">Booking not found.</div>;

  const statusTone =
    STATUS_TONE[booking.status?.toLowerCase()] ||
    "bg-slate-50 text-slate-700 border-slate-200";

  // Only an unsettled booking can be paid or cancelled.
  const isPending =
    String(booking.status ?? "").toLowerCase() === "pending_payment";
  const owes = Number(booking.total_amount ?? 0) > 0;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Booking Details"
        description={booking.event?.title || booking.event_title || undefined}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${statusTone}`}
          >
            {String(booking.status).replace(/_/g, " ")}
          </span>
        }
      />

      {/* Booking summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Booking Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <MdConfirmationNumber className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Reference:{" "}
              <span className="font-mono font-medium">
                {booking.reference_code}
              </span>
            </span>
          </div>
          <div className="text-slate-700">
            <span className="text-slate-500">Amount: </span>
            <span className="font-semibold">
              KES {Number(booking.total_amount ?? 0).toLocaleString()}
            </span>
          </div>
          {booking.contact_name && (
            <div className="text-slate-700">
              <span className="text-slate-500">Contact: </span>
              <span className="font-medium">{booking.contact_name}</span>
            </div>
          )}
          {(booking.contact_email || booking.contact_phone) && (
            <div className="text-slate-700 truncate">
              <span className="text-slate-500">Reachable on: </span>
              <span className="font-medium">
                {[booking.contact_email, booking.contact_phone]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}
          <div className="text-slate-700">
            <span className="text-slate-500">Booked on: </span>
            <span className="font-medium">{fmtDate(booking.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Event details */}
      {booking.event && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Event
          </h3>
          <div className="text-base font-semibold text-slate-900">
            {booking.event.title}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <MdCalendarToday className="w-4 h-4 text-slate-400 shrink-0" />
              {fmtDate(booking.event.start_date)}
            </div>
            {booking.event.location && (
              <div className="flex items-center gap-2">
                <MdLocationOn className="w-4 h-4 text-slate-400 shrink-0" />
                {booking.event.location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Package details */}
      {booking.package && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Package
          </h3>
          <div className="font-medium text-slate-900">
            {booking.package.name}
          </div>
        </div>
      )}

      {/* Invoice */}
      {booking.invoice && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invoice
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-500">Number</div>
            <div className="font-mono text-slate-700 text-xs">
              {booking.invoice.invoice_number}
            </div>
            <div className="text-slate-500">Amount</div>
            <div className="font-semibold text-slate-900">
              KES {Number(booking.invoice.amount).toLocaleString()}
            </div>
            {booking.invoice.status && (
              <>
                <div className="text-slate-500">Status</div>
                <div className="capitalize font-medium text-slate-700">
                  {booking.invoice.status}
                </div>
              </>
            )}
            {booking.invoice.due_date && (
              <>
                <div className="text-slate-500">Due</div>
                <div className="text-slate-700">
                  {fmtDate(booking.invoice.due_date)}
                </div>
              </>
            )}
            {booking.invoice.paid_at && (
              <>
                <div className="text-slate-500">Paid at</div>
                <div className="text-slate-700">
                  {fmtDateTime(booking.invoice.paid_at)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending-payment actions */}
      {isPending && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment pending
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {owes
                ? "Complete payment to confirm this booking, or cancel it."
                : "This booking is awaiting confirmation."}
            </p>
          </div>

          {payBooking.isSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              STK push sent. Enter your M-Pesa PIN on your phone.
            </div>
          )}

          {owes && (
            <div className="space-y-1">
              <label className="text-[11px] uppercase text-slate-500">
                M-Pesa number
              </label>
              <input
                value={payPhone}
                onChange={(e) => setPayPhone(e.target.value)}
                placeholder={booking.contact_phone || "254712345678"}
                className="w-full sm:max-w-xs px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <p className="text-[11px] text-slate-400">
                Leave blank to bill the contact phone on the booking.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {owes && (
              <button
                onClick={() =>
                  payBooking.mutate({
                    bookingId: booking.id,
                    phone_number: payPhone.trim() || undefined,
                  })
                }
                disabled={payBooking.isPending}
                className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {payBooking.isPending
                  ? "Sending…"
                  : payBooking.isSuccess
                    ? "Resend payment request"
                    : "Pay via M-Pesa"}
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Cancel this booking? This cannot be undone."))
                  cancelBooking.mutate(booking.id);
              }}
              disabled={cancelBooking.isPending}
              className="border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              {cancelBooking.isPending ? "Cancelling…" : "Cancel booking"}
            </button>
          </div>
        </div>
      )}

      {/* Attendees */}
      {booking.attendees && booking.attendees.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Attendees ({booking.attendees.length})
          </h3>
          <ul className="divide-y divide-slate-100">
            {booking.attendees.map((a) => (
              <li
                key={a.id}
                className="py-2 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {a.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {[a.email, a.phone].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                {a.ticket_number && (
                  <span className="font-mono text-xs text-slate-500 shrink-0">
                    #{a.ticket_number}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Browse more events */}
      <div className="flex justify-center">
        <Link
          href="/nnak/me/events"
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <MdBookmarks className="w-4 h-4" />
          Browse more events
        </Link>
      </div>
    </div>
  );
}
