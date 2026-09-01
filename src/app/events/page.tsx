"use client";
import { useState } from "react";
import Link from "next/link";
import {
  MdCalendarToday,
  MdEvent,
  MdLocationOn,
  MdSearch,
} from "react-icons/md";
import Pagination from "@/components/common/Pagination";
import { usePublicEvents } from "@/hooks/use-public-events";
import type { PublicEvent } from "@/types/nnak";

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
  const sameMonth =
    s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (sameMonth)
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

/**
 * Public event listing — the same `/events` read the member portal uses, but
 * reachable without a session so an event can be linked to and shared.
 */
export default function PublicEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = usePublicEvents({
    search: search || undefined,
    page,
    per_page: 12,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Upcoming Events</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Conferences, workshops and CPD sessions. Register without an account —
          members sign in for member rates.
        </p>
      </div>

      <div className="relative max-w-md">
        <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search events…"
          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
        />
      </div>

      {isLoading && events.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl h-56 animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 text-center">
          <MdEvent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {search
              ? `No events match “${search}”.`
              : "No upcoming events right now. Please check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          itemsPerPage={pagination.per_page}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

const EventCard = ({ event }: { event: PublicEvent }) => (
  <Link
    href={`/events/${event.id}`}
    className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-primary hover:shadow-sm transition-all"
  >
    <div className="h-32 bg-slate-100 relative shrink-0">
      {event.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_image_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MdEvent className="w-8 h-8 text-slate-300" />
        </div>
      )}
    </div>

    <div className="p-4 flex flex-col gap-2 flex-1">
      <h2 className="font-semibold text-slate-900 leading-snug group-hover:text-primary">
        {event.title}
      </h2>
      {event.theme && (
        <p className="text-xs text-slate-500 line-clamp-2">{event.theme}</p>
      )}
      <div className="mt-auto pt-2 space-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {fmtRange(event.start_date, event.end_date)}
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MdLocationOn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  </Link>
);
