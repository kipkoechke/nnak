"use client";
import { Suspense, use } from "react";
import EventTabsPage from "./EventTabs";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    // EventTabs reads the active tab from the query string via
    // useSearchParams, which Next requires to sit under a Suspense boundary.
    <Suspense
      fallback={
        <div className="px-4 py-6 space-y-4">
          <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      }
    >
      <EventTabsPage eventId={id} />
    </Suspense>
  );
}
