"use client";
import { useState } from "react";
import Link from "next/link";
import { MdEvent, MdSearch, MdCalendarToday, MdLocationOn } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { usePublicEvents } from "@/hooks/use-public-events";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Finance picks an event here, then drills into its read-only bookings,
 * attendees and attendance under /finance/events/{event}.
 */
export default function FinanceEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = usePublicEvents({
    page,
    per_page: 15,
    search: search.trim() || undefined,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Events"
        description="Review bookings, attendees and attendance for any event"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title…"
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-20"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <MdEvent className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No events found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try a different search term.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/nnak/finance/events/${e.id}`}
                className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 group-hover:text-primary transition-colors truncate">
                    {e.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MdCalendarToday className="w-3.5 h-3.5" />
                      {fmtDate(e.start_date)}
                    </span>
                    {e.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MdLocationOn className="w-3.5 h-3.5 shrink-0" />
                        {e.location}
                      </span>
                    )}
                  </div>
                </div>
                {e.packages_count != null && (
                  <span className="text-xs text-slate-500 shrink-0 ml-3">
                    {e.packages_count} package
                    {e.packages_count === 1 ? "" : "s"}
                  </span>
                )}
              </Link>
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
