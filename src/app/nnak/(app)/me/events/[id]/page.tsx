"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  MdCalendarToday,
  MdEvent,
  MdLocationOn,
  MdPeople,
  MdStar,
  MdCheckCircle,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { EventMap } from "@/components/common/EventMap";
import { useMemberEvent, useMemberEventPackages } from "@/hooks/use-member-events";
import { useStudentEvent, useStudentEventPackages } from "@/hooks/use-student-events";
import BookingModal from "@/components/events/BookingModal";
import { useBookingScope } from "@/hooks/use-bookings";
import { useNnakMe } from "@/hooks/use-auth";
import { nqk } from "@/lib/query-keys";
import type { MemberEventPackage } from "@/types/nnak";

const STATUS_TONE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
};

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

/** Resolve the actual price from either `cost` or legacy `price` field */
const pkgCost = (pkg: MemberEventPackage) =>
  Number(pkg.cost ?? pkg.price ?? 0);

export default function MemberEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useNnakMe();
  const isStudent = me?.role === "student";

  // Gate each pair to its role — never fire both at once
  const memberEventQ = useMemberEvent(id, { enabled: !!id && !meLoading && !isStudent });
  const studentEventQ = useStudentEvent(id, { enabled: !!id && !meLoading && isStudent });
  const memberPkgQ = useMemberEventPackages(id, { enabled: !!id && !meLoading && !isStudent });
  const studentPkgQ = useStudentEventPackages(id, { enabled: !!id && !meLoading && isStudent });

  const event = isStudent ? studentEventQ.data : memberEventQ.data;
  const isLoading = meLoading || (isStudent ? studentEventQ.isLoading : memberEventQ.isLoading);
  const packages = (isStudent ? studentPkgQ.data : memberPkgQ.data) ?? [];
  const packagesLoading = isStudent ? studentPkgQ.isLoading : memberPkgQ.isLoading;

  const [tab, setTab] = useState<"details" | "packages">("details");
  const [selectedPackage, setSelectedPackage] =
    useState<MemberEventPackage | null>(null);

  // Bookings are role-scoped (/member/bookings vs /student/bookings).
  const bookingScope = useBookingScope();

  // Once a booking is made the event's registration state is stale.
  const refreshEvent = () => {
    if (isStudent) {
      qc.invalidateQueries({ queryKey: nqk.studentEvents.detail(id) });
      qc.invalidateQueries({ queryKey: nqk.studentEvents.packages(id) });
    } else {
      qc.invalidateQueries({ queryKey: nqk.memberEvents.detail(id) });
      qc.invalidateQueries({ queryKey: nqk.memberEvents.packages(id) });
    }
  };

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading event…</div>;
  if (!event)
    return <div className="p-4 text-sm text-slate-500">Event not found.</div>;

  const coords = (event as { location_coordinates?: { lat: number; lng: number } | null })
    .location_coordinates;
  const meta = (event as { metadata?: { expected_attendees?: number; tracks?: string[]; cpd_points?: number } | null })
    .metadata;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={event.title}
        description={event.theme || undefined}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_TONE[event.status] || STATUS_TONE.draft}`}
          >
            {event.status}
          </span>
        }
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
          <div className="flex items-center gap-2 text-slate-700">
            <MdEvent className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="capitalize">{event.type}</span>
          </div>
        </div>

        {/* Metadata chips */}
        {meta && (
          <div className="mt-3 flex flex-wrap gap-2">
            {meta.cpd_points != null && (
              <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2.5 py-0.5 font-medium">
                <MdStar className="w-3.5 h-3.5" /> {meta.cpd_points} CPD Points
              </span>
            )}
            {meta.expected_attendees != null && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
                <MdPeople className="w-3.5 h-3.5" /> {meta.expected_attendees.toLocaleString()} expected
              </span>
            )}
            {meta.tracks?.map((t) => (
              <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {event.is_registered && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <MdPeople className="w-3.5 h-3.5" /> You are registered for this event
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
              <EventMap lat={coords.lat} lng={coords.lng} label={event.location || event.title} />
            </div>
          )}

          {event.speakers && event.speakers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Speakers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.speakers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">{s.name}</div>
                      {s.role && (
                        <div className="text-xs text-slate-500">{s.role}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.agenda && event.agenda.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Agenda
              </h3>
              <div className="space-y-2">
                {event.agenda.map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1"
                  >
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {a.start_time} – {a.end_time}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{a.title}</div>
                      {a.description && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {a.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packages tab */}
      {tab === "packages" && (
        <div>
          {packagesLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading packages…</div>
          ) : packages.length === 0 ? (
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
                  isRegistered={!!event.is_registered}
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
  isRegistered,
  onSelect,
}: {
  pkg: MemberEventPackage;
  isRegistered: boolean;
  onSelect: () => void;
}) => {
  const cost = pkgCost(pkg);
  const benefitEntries = pkg.benefits ? Object.entries(pkg.benefits) : null;
  const soldOut = pkg.is_available === false || (pkg.has_limit && pkg.max_entries != null && pkg.max_entries <= 0);

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
        <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
      )}

      {/* Benefits object */}
      {benefitEntries && benefitEntries.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1">
          {benefitEntries.map(([key, val]) => (
            <li key={key} className="flex items-start gap-1.5">
              <MdCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><span className="capitalize text-slate-500">{key.replace(/_/g, " ")}:</span> {val}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Legacy features array */}
      {!benefitEntries && pkg.features && pkg.features.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {f}
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
          disabled={!!soldOut || isRegistered}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRegistered ? "Registered" : "Select"}
        </button>
      </div>
    </div>
  );
};
