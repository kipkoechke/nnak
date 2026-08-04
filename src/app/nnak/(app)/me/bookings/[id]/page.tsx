"use client";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdCalendarToday, MdBookmarks, MdLocationOn, MdConfirmationNumber } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import {
  useBooking,
  useBookingScope,
  useCancelBooking,
  usePayBooking,
} from "@/hooks/use-bookings";

const STATUS_TONE: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  attended: "bg-blue-50 text-blue-700 border-blue-200",
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
  const scope = useBookingScope();
  const payBooking = usePayBooking(scope);
  const cancelBooking = useCancelBooking(scope);
  // Poll while an STK push is in flight so the status flips without a refresh.
  const { data: booking, isLoading } = useBooking(scope, id, {
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
  const isPending = ["pending", "pending_payment", "unpaid"].includes(
    String(booking.status ?? "").toLowerCase(),
  );
  const owes = Number(booking.amount ?? 0) > 0;

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
            {booking.status}
          </span>
        }
      />

      {/* Booking summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Booking Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {booking.ticket_number && (
            <div className="flex items-center gap-2 text-slate-700">
              <MdConfirmationNumber className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Ticket: <span className="font-mono font-medium">{booking.ticket_number}</span>
              </span>
            </div>
          )}
          {booking.amount != null && (
            <div className="text-slate-700">
              <span className="text-slate-500">Amount: </span>
              <span className="font-semibold">KES {Number(booking.amount).toLocaleString()}</span>
            </div>
          )}
          {booking.paid_at && (
            <div className="text-slate-700">
              <span className="text-slate-500">Paid at: </span>
              <span className="font-medium">{fmtDateTime(booking.paid_at)}</span>
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
              {booking.event.end_date !== booking.event.start_date && (
                <> → {fmtDate(booking.event.end_date)}</>
              )}
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
          <div className="font-medium text-slate-900">{booking.package.name}</div>
          {booking.package.description && (
            <p className="text-xs text-slate-500">{booking.package.description}</p>
          )}
          {booking.package.features && booking.package.features.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-1 mt-2">
              {booking.package.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Payment details */}
      {booking.payment && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-500">Amount</div>
            <div className="font-semibold text-slate-900">
              KES {Number(booking.payment.amount).toLocaleString()}
            </div>
            <div className="text-slate-500">Status</div>
            <div className="capitalize font-medium text-slate-700">{booking.payment.status}</div>
            {booking.payment.method && (
              <>
                <div className="text-slate-500">Method</div>
                <div className="text-slate-700 capitalize">{booking.payment.method}</div>
              </>
            )}
            {booking.payment.reference && (
              <>
                <div className="text-slate-500">Reference</div>
                <div className="font-mono text-slate-700 text-xs">{booking.payment.reference}</div>
              </>
            )}
            {booking.payment.paid_at && (
              <>
                <div className="text-slate-500">Paid at</div>
                <div className="text-slate-700">{fmtDateTime(booking.payment.paid_at)}</div>
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

          <div className="flex flex-wrap gap-2">
            {owes && (
              <button
                onClick={() => payBooking.mutate(booking.id)}
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
