"use client";
import { useState } from "react";
import Link from "next/link";
import { MdEvent, MdSearch, MdCalendarToday, MdLocationOn } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useMemberEvents } from "@/hooks/use-member-events";
import type { MemberEvent } from "@/types/nnak";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-slate-400",
  published: "bg-emerald-500",
  closed: "bg-amber-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

const TYPE_TONE: Record<string, string> = {
  conference: "bg-violet-50 text-violet-700",
  workshop: "bg-cyan-50 text-cyan-700",
  cpd: "bg-emerald-50 text-emerald-700",
  agm: "bg-amber-50 text-amber-700",
  training: "bg-blue-50 text-blue-700",
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
];

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
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth)
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

export default function MemberEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useMemberEvents({
    page,
    per_page: 12,
    search: search || undefined,
    status: status || undefined,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Events"
        description="Browse and register for upcoming NNAK events"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events…"
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-32 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MdEvent className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
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

const EventCard = ({ event }: { event: MemberEvent }) => (
  <Link
    href={`/nnak/me/events/${event.id}`}
    className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all flex flex-col"
  >
    <div className="relative h-32 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/60">
      {event.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_image_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <MdEvent className="w-12 h-12" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute top-2 left-2 flex gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_TONE[event.status] || STATUS_TONE.draft}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[event.status] || STATUS_DOT.draft}`} />
          {event.status}
        </span>
      </div>
      <div className="absolute bottom-2 right-2">
        <span
          className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${TYPE_TONE[event.type] || "bg-slate-100 text-slate-700"}`}
        >
          {event.type}
        </span>
      </div>
      {event.is_registered && (
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
            Registered
          </span>
        </div>
      )}
    </div>

    <div className="p-4 flex-1 flex flex-col gap-2">
      <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
        {event.title}
      </h3>
      {event.theme && (
        <p className="text-[11px] text-slate-500 italic line-clamp-1">{event.theme}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <MdCalendarToday className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {fmtRange(event.start_date, event.end_date)}
      </div>
      {event.location && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MdLocationOn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  </Link>
);
