"use client";
import { useState } from "react";
import { MdAdd, MdClose, MdDeleteOutline } from "react-icons/md";
import {
  useBooking,
  useCreateBooking,
  usePayBooking,
} from "@/hooks/use-bookings";
import type {
  BookingAttendeeInput,
  BookingScope,
  MemberEventPackage,
} from "@/types/nnak";

const pkgCost = (pkg: MemberEventPackage) => Number(pkg.cost ?? pkg.price ?? 0);

const blankAttendee = (): BookingAttendeeInput => ({
  name: "",
  email: "",
  phone: "",
});

const isSettled = (s?: string | null) =>
  !!s && ["paid", "confirmed"].includes(String(s).toLowerCase());

interface BookingModalProps {
  scope: BookingScope;
  pkg: MemberEventPackage;
  /** Prefills the first attendee row with the signed-in user. */
  defaultAttendee?: BookingAttendeeInput;
  onClose: () => void;
  onBooked?: () => void;
}

/**
 * Books an event package: collect attendees -> POST /bookings -> POST
 * /bookings/{id}/pay, then polls the booking until payment settles.
 */
export default function BookingModal({
  scope,
  pkg,
  defaultAttendee,
  onClose,
  onBooked,
}: BookingModalProps) {
  const [attendees, setAttendees] = useState<BookingAttendeeInput[]>([
    defaultAttendee ?? blankAttendee(),
  ]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCreateBooking(scope);
  const payBooking = usePayBooking(scope);
  // Poll only once a payment has been kicked off.
  const { data: booking } = useBooking(scope, bookingId ?? undefined, {
    poll: payBooking.isSuccess,
  });

  const cost = pkgCost(pkg);
  const total = cost * attendees.length;
  const paid = isSettled(booking?.status);

  const setAt = (i: number, patch: Partial<BookingAttendeeInput>) =>
    setAttendees((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const submit = async () => {
    setError(null);
    const cleaned = attendees
      .map((a) => ({
        name: a.name.trim(),
        email: a.email?.trim() || undefined,
        phone: a.phone?.trim() || undefined,
      }))
      .filter((a) => a.name.length > 0);

    if (cleaned.length === 0) {
      setError("Add at least one attendee with a name.");
      return;
    }

    const created = await createBooking
      .mutateAsync({ event_package_id: pkg.id, attendees: cleaned })
      .catch(() => null);
    if (!created?.id) return;
    setBookingId(created.id);
    onBooked?.();

    // Free packages have no invoice to settle.
    if (total > 0) await payBooking.mutateAsync(created.id).catch(() => null);
  };

  const awaitingPayment = payBooking.isSuccess && !paid;
  const busy = createBooking.isPending || payBooking.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Book {pkg.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Success */}
          {paid ? (
            <div className="text-sm rounded-md px-3 py-4 text-center bg-emerald-50 border border-emerald-200 text-emerald-700">
              <div className="font-semibold mb-1">Booking confirmed</div>
              {booking?.ticket_number && (
                <div className="text-xs">
                  Ticket{" "}
                  <span className="font-mono font-semibold">
                    {booking.ticket_number}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Attendees */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attendees
                  </h4>
                  {!bookingId && (
                    <button
                      type="button"
                      onClick={() =>
                        setAttendees((r) => [...r, blankAttendee()])
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <MdAdd className="w-4 h-4" /> Add attendee
                    </button>
                  )}
                </div>

                {attendees.map((a, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase text-slate-500">
                        Attendee {i + 1}
                      </span>
                      {attendees.length > 1 && !bookingId && (
                        <button
                          type="button"
                          onClick={() =>
                            setAttendees((r) => r.filter((_, x) => x !== i))
                          }
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Remove attendee"
                        >
                          <MdDeleteOutline className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      value={a.name}
                      onChange={(e) => setAt(i, { name: e.target.value })}
                      disabled={!!bookingId}
                      placeholder="Full name *"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-50"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={a.email ?? ""}
                        onChange={(e) => setAt(i, { email: e.target.value })}
                        disabled={!!bookingId}
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-50"
                      />
                      <input
                        value={a.phone ?? ""}
                        onChange={(e) => setAt(i, { phone: e.target.value })}
                        disabled={!!bookingId}
                        placeholder="Phone"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {cost === 0 ? "Free" : `KES ${cost.toLocaleString()}`} ×{" "}
                    {attendees.length}
                  </span>
                  <span className="font-semibold">
                    {total === 0 ? "Free" : `KES ${total.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {awaitingPayment && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  STK push sent. Enter your M-Pesa PIN on your phone.
                </div>
              )}

              {error && (
                <div className="text-xs rounded-md px-3 py-2 bg-red-50 border border-red-200 text-red-700">
                  {error}
                </div>
              )}

              {!bookingId && (
                <button
                  onClick={submit}
                  disabled={busy}
                  className="w-full bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {createBooking.isPending
                    ? "Creating booking…"
                    : payBooking.isPending
                      ? "Starting payment…"
                      : total === 0
                        ? "Confirm booking"
                        : `Book & pay KES ${total.toLocaleString()}`}
                </button>
              )}

              {bookingId && !awaitingPayment && !paid && total > 0 && (
                <button
                  onClick={() => payBooking.mutate(bookingId)}
                  disabled={payBooking.isPending}
                  className="w-full bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {payBooking.isPending ? "Sending…" : "Retry payment"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
