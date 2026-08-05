"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  MdCalendarToday,
  MdEvent,
  MdLocationOn,
  MdCheckCircle,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { EventMap } from "@/components/common/EventMap";
import { usePublicEvent } from "@/hooks/use-public-events";
import BookingModal from "@/components/events/BookingModal";
import { useBookingScope } from "@/hooks/use-bookings";
import { useNnakMe } from "@/hooks/use-auth";
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
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

const pkgCost = (pkg: EventPackage) => Number(pkg.cost ?? 0);

export default function MemberEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useNnakMe();

  // One public endpoint serves every role; packages come inlined on it.
  const { data: event, isLoading } = usePublicEvent(id);
  const packages = event?.packages ?? [];

  const [tab, setTab] = useState<"details" | "packages">("details");
  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(
    null,
  );

  // Bookings are role-scoped (/member/bookings vs /student/bookings).
  const bookingScope = useBookingScope();

  // A new booking can change package availability, so re-read the event.
  const refreshEvent = () => {
    qc.invalidateQueries({ queryKey: nqk.publicEvents.detail(id) });
    qc.invalidateQueries({ queryKey: nqk.publicEvents.packages(id) });
  };

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading event…</div>;
  if (!event)
    return <div className="p-4 text-sm text-slate-500">Event not found.</div>;

  const coords = event.location_coordinates;
  const metaChips = Object.entries(event.metadata ?? {}).filter(
    ([, v]) => typeof v === "string" || typeof v === "number",
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={event.title}
        description={event.theme || undefined}
        back={() => router.back()}
      />

      {/* Cover image */}
      {event.cover_image_url && (
        <div className="relative h-48 rounded-xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {/* Key info row */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
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

        {metaChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metaChips.map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5"
              >
                <span className="capitalize text-slate-400">
                  {key.replace(/_/g, " ")}
                </span>
                {String(val)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["details", "packages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="space-y-4">
          {event.description && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                About this event
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Map */}
          {coords && coords.lat != null && coords.lng != null && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
                <MdLocationOn className="w-4 h-4" /> Venue
              </h3>
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
        </div>
      )}

      {/* Packages tab */}
      {tab === "packages" && (
        <div>
          {packages.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 text-center">
              <MdEvent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No packages available for this event.
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
      )}

      {/* Booking + M-Pesa payment */}
      {selectedPackage && (
        <BookingModal
          scope={bookingScope}
          pkg={selectedPackage}
          defaultAttendee={{
            name: me?.name ?? "",
            email: me?.email ?? "",
            phone: me?.profile?.phone ?? "",
          }}
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{pkg.name}</h4>
          {pkg.is_member_only && (
            <span className="text-[10px] text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
              Members only
            </span>
          )}
        </div>
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

      {pkg.has_limit && pkg.max_entries != null && (
        <div className="text-xs text-slate-500">
          Capacity: {pkg.max_entries} slots
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-base font-bold text-slate-900">
          {cost === 0 ? "Free" : `KES ${cost.toLocaleString()}`}
        </div>
        <button
          onClick={onSelect}
          disabled={soldOut}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Select
        </button>
      </div>
    </div>
  );
};
