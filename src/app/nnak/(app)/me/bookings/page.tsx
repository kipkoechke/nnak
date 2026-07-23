"use client";
import { useState } from "react";
import Link from "next/link";
import { MdBookmarks, MdConfirmationNumber, MdPeople } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useBookingScope, useMyBookings } from "@/hooks/use-bookings";
import type { MyBooking } from "@/types/nnak";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export default function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  // Members and students have separate booking endpoints — pick by role.
  const scope = useBookingScope();
  const { data, isLoading } = useMyBookings(scope, {
    page,
    per_page: 15,
    status: status || undefined,
  });

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="My Bookings"
        description="Your event bookings and registration history"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            onClick={() => { setStatus(opt.value); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              status === opt.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MdBookmarks className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No bookings yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse events and register to see your bookings here.
          </p>
          <Link
            href="/nnak/me/events"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {bookings.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
          {pagination && pagination.last_page > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.last_page}
              totalItems={pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

const BookingRow = ({ booking }: { booking: MyBooking }) => {
  const statusTone =
    STATUS_TONE[booking.status?.toLowerCase()] ||
    "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <Link
      href={`/nnak/me/bookings/${booking.id}`}
      className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-primary hover:shadow-sm transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 group-hover:text-primary transition-colors truncate">
          {booking.event_title || "Event"}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-mono text-slate-400">
            <MdConfirmationNumber className="w-3.5 h-3.5" />
            {booking.reference_code}
          </span>
          {booking.package_name && <span>{booking.package_name}</span>}
          {booking.attendees_count != null && (
            <span className="flex items-center gap-1">
              <MdPeople className="w-3.5 h-3.5" />
              {booking.attendees_count}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-sm font-semibold text-slate-900">
          KES {Number(booking.total_amount ?? 0).toLocaleString()}
        </span>
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${statusTone}`}
        >
          {String(booking.status).replace(/_/g, " ")}
        </span>
      </div>
    </Link>
  );
};
