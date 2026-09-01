"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  MdArrowBack,
  MdCalendarToday,
  MdCheckCircle,
  MdEvent,
  MdLocationOn,
} from "react-icons/md";
import { EventMap } from "@/components/common/EventMap";
import BookingModal from "@/components/events/BookingModal";
import { usePublicEvent } from "@/hooks/use-public-events";
import { nqk } from "@/lib/query-keys";
import type { EventPackage } from "@/types/nnak";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return fmtDate(start);
  return `${fmtDate(start)} — ${fmtDate(end)}`;
};

const pkgCost = (pkg: EventPackage) => Number(pkg.cost ?? 0);

/**
 * Public event detail and registration.
 *
 * Booking goes through the unprefixed `/bookings` route, which exists for
 * exactly this case: a guest books by leaving contact details and pays by
 * M-Pesa, no account required. Member-only packages stay visible but locked,
 * so the member rate reads as a reason to sign in rather than being hidden.
 */
export default function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { data: event, isLoading } = usePublicEvent(id);
  const packages = event?.packages ?? [];

  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(
    null,
  );

  // A new booking can change package availability, so re-read the event.
  const refreshEvent = () => {
    qc.invalidateQueries({ queryKey: nqk.publicEvents.detail(id) });
    qc.invalidateQueries({ queryKey: nqk.publicEvents.packages(id) });
  };

  if (isLoading)
    return <div className="py-10 text-sm text-slate-500">Loading event…</div>;
  if (!event)
    return (
      <div className="py-10 text-center">
        <MdEvent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">This event is not available.</p>
        <Link
          href="/events"
          className="text-sm text-primary font-medium hover:underline mt-2 inline-block"
        >
          Back to all events
        </Link>
      </div>
    );

  const coords = event.location_coordinates;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 w-fit"
      >
        <MdArrowBack className="w-4 h-4" /> All events
      </Link>

      {event.cover_image_url && (
        <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        {event.theme && (
          <p className="text-sm text-slate-500 mt-1">{event.theme}</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <MdCalendarToday className="w-4 h-4 text-slate-400 shrink-0" />
          {fmtRange(event.start_date, event.end_date)}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-slate-700">
            <MdLocationOn className="w-4 h-4 text-slate-400 shrink-0" />
            {event.location}
          </div>
        )}
        {event.type && (
          <div className="flex items-center gap-2 text-slate-700">
            <MdEvent className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="capitalize">{event.type}</span>
          </div>
        )}
      </div>

      {event.description && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            About this event
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Registration
        </h2>
        {packages.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl py-10 text-center">
            <p className="text-sm text-slate-500">
              Registration is not open for this event yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={() => setSelectedPackage(pkg)}
              />
            ))}
          </div>
        )}
      </div>

      {coords && coords.lat != null && coords.lng != null && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
            <MdLocationOn className="w-4 h-4" /> Venue
          </h2>
          {event.location && (
            <p className="text-sm text-slate-700 mb-3">{event.location}</p>
          )}
          <EventMap
            lat={coords.lat}
            lng={coords.lng}
            label={event.location || event.title}
          />
        </div>
      )}

      {selectedPackage && (
        <BookingModal
          scope="public"
          pkg={selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onBooked={refreshEvent}
        />
      )}
    </div>
  );
}

const PackageCard = ({
  pkg,
  onSelect,
}: {
  pkg: EventPackage;
  onSelect: () => void;
}) => {
  const cost = pkgCost(pkg);
  const soldOut =
    !!pkg.has_limit && pkg.max_entries != null && pkg.max_entries <= 0;
  // A guest cannot claim a member rate, and the API would reject the booking.
  const membersOnly = !!pkg.is_member_only;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
        {soldOut && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap shrink-0">
            Sold out
          </span>
        )}
      </div>

      {pkg.description && (
        <p className="text-xs text-slate-500 leading-relaxed">
          {pkg.description}
        </p>
      )}

      {pkg.benefits && pkg.benefits.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1">
          {pkg.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <MdCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-base font-bold text-slate-900">
          {cost === 0 ? "Free" : `KES ${cost.toLocaleString()}`}
        </div>
        {membersOnly ? (
          <Link
            href="/nnak/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-primary text-primary hover:bg-primary/5"
          >
            Sign in to book
          </Link>
        ) : (
          <button
            onClick={onSelect}
            disabled={soldOut}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Register
          </button>
        )}
      </div>
    </div>
  );
};
