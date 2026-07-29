"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MdAdd,
  MdCalendarToday,
  MdCheckCircle,
  MdEvent,
  MdLocationOn,
  MdPendingActions,
  MdSearch,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useEvents } from "@/hooks/use-events";
import type { NnakEvent } from "@/types/nnak";

const TYPE_TONE: Record<string, string> = {
  conference: "bg-violet-50 text-violet-700",
  workshop: "bg-cyan-50 text-cyan-700",
  cpd: "bg-emerald-50 text-emerald-700",
  agm: "bg-amber-50 text-amber-700",
  training: "bg-blue-50 text-blue-700",
};

/** The API has no status field — an event is either approved or awaiting it. */
const APPROVAL_OPTIONS = [
  { value: "", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Awaiting approval" },
] as const;

type ApprovalFilter = (typeof APPROVAL_OPTIONS)[number]["value"];

const PER_PAGE_OPTIONS = [15, 30, 60];

/** Groups derived from the dates, since the API exposes no lifecycle state. */
type Phase = "ongoing" | "upcoming" | "past";

const PHASE_LABEL: Record<Phase, string> = {
  ongoing: "Happening now",
  upcoming: "Upcoming",
  past: "Past",
};

const PHASE_ORDER: Phase[] = ["ongoing", "upcoming", "past"];

const phaseOf = (e: NnakEvent): Phase => {
  const now = Date.now();
  const start = new Date(e.start_date).setHours(0, 0, 0, 0);
  const end = new Date(e.end_date).setHours(23, 59, 59, 999);
  if (now > end) return "past";
  if (now >= start) return "ongoing";
  return "upcoming";
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
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameYear && s.getMonth() === e.getMonth())
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

export default function EventsPage() {
  const [approval, setApproval] = useState<ApprovalFilter>("");
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);

  // `search` is an ilike on title, applied server-side.
  const { data, isLoading } = useEvents({
    search: search.trim() || undefined,
    page,
    per_page: perPage,
  });

  const events = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  // Approval is not a query parameter, so it narrows the fetched page only.
  const filtered = useMemo(
    () =>
      approval === ""
        ? events
        : events.filter((e) => e.is_approved === (approval === "approved")),
    [events, approval],
  );

  /** Ongoing first, then what is coming, then the archive. */
  const sections = useMemo(() => {
    const buckets = new Map<Phase, NnakEvent[]>();
    filtered.forEach((e) => {
      const p = phaseOf(e);
      buckets.set(p, [...(buckets.get(p) ?? []), e]);
    });
    return PHASE_ORDER.filter((p) => buckets.has(p)).map((p) => {
      const items = [...(buckets.get(p) ?? [])].sort((a, b) =>
        p === "past"
          ? b.start_date.localeCompare(a.start_date)
          : a.start_date.localeCompare(b.start_date),
      );
      return { phase: p, items };
    });
  }, [filtered]);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Events"
        description="Plan, publish and manage NNAK events"
        action={
          <Link
            href="/nnak/events/new"
            className="inline-flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm"
          >
            <MdAdd className="w-4 h-4" /> New event
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title…"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {APPROVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              onClick={() => setApproval(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                approval === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          <label className="text-xs text-slate-500 whitespace-nowrap">
            Per page
          </label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* The API cannot filter on approval, so say what is actually happening. */}
      {approval !== "" && pagination && pagination.last_page > 1 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Approval filtering applies to this page of results only — page {page}{" "}
          of {pagination.last_page}.
        </p>
      )}

      {/* Body */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!search || !!approval} />
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {sections.map(({ phase, items }) => (
              <section key={phase}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xs uppercase font-semibold tracking-wide text-slate-500">
                    {PHASE_LABEL[phase]}
                  </h2>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {items.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map((e) => (
                    <EventCard key={e.id} event={e} phase={phase} />
                  ))}
                </div>
              </section>
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

const EventCard = ({ event, phase }: { event: NnakEvent; phase: Phase }) => (
  <Link
    href={`/nnak/events/${event.id}`}
    className={`group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all flex flex-col ${
      phase === "past" ? "opacity-75 hover:opacity-100" : ""
    }`}
  >
    {/* Cover */}
    <div className="relative h-32 bg-gradient-to-br from-primary/90 via-primary/70 to-primary-dark">
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
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />

      <div className="absolute top-2 left-2 flex gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            event.is_approved
              ? "bg-emerald-500 text-white"
              : "bg-amber-400 text-amber-950"
          }`}
        >
          {event.is_approved ? (
            <MdCheckCircle className="w-3 h-3" />
          ) : (
            <MdPendingActions className="w-3 h-3" />
          )}
          {event.is_approved ? "Approved" : "Pending"}
        </span>
        {phase === "ongoing" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {event.code && (
        <span className="absolute bottom-2 left-2 inline-flex items-center text-[10px] font-mono bg-black/45 text-white px-2 py-0.5 rounded-full">
          {event.code}
        </span>
      )}
      {event.type && (
        <span
          className={`absolute bottom-2 right-2 inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            TYPE_TONE[event.type] || "bg-slate-100 text-slate-700"
          }`}
        >
          {event.type}
        </span>
      )}
    </div>

    {/* Body */}
    <div className="p-4 flex-1 flex flex-col gap-2">
      <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
        {event.title}
      </h3>
      {event.theme && (
        <p className="text-[11px] text-slate-500 italic line-clamp-1">
          {event.theme}
        </p>
      )}
      <div className="mt-auto pt-2 space-y-1.5">
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
    </div>
  </Link>
);

const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
    <div className="h-32 bg-slate-100" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-slate-100 rounded w-3/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  </div>
);

const EmptyState = ({ hasQuery }: { hasQuery: boolean }) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
      <MdEvent className="w-7 h-7 text-primary" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900">
      {hasQuery ? "No events match" : "No events yet"}
    </h3>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
      {hasQuery
        ? "Try clearing the filters or searching for a different term."
        : "Create your first event to start managing agendas, speakers and registrations."}
    </p>
    {!hasQuery && (
      <Link
        href="/nnak/events/new"
        className="inline-flex items-center gap-1.5 mt-4 bg-primary text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
      >
        <MdAdd className="w-4 h-4" /> New event
      </Link>
    )}
  </div>
);
