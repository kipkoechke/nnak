"use client";
import { useRouter } from "next/navigation";
import EventForm from "../EventForm";
import { useUpsertEvent } from "@/hooks/nnak/use-events";
import PageHeader from "@/components/common/PageHeader";

export default function NewEventPage() {
  const router = useRouter();
  const upsert = useUpsertEvent();
  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="New Event" back={() => router.back()} />
      <EventForm
        onSubmit={async (data) => {
          const e = await upsert.mutateAsync(data);
          router.push(`/nnak/events/${e.id}`);
        }}
        submitting={upsert.isPending}
      />
    </div>
  );
}
