"use client";
import { use } from "react";
import EventTabsPage from "./EventTabs";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EventTabsPage eventId={id} />;
}
