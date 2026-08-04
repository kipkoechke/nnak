"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdArrowBack,
  MdCheckCircle,
  MdConfirmationNumber,
  MdDelete,
  MdEdit,
  MdEvent,
  MdHowToReg,
  MdMoreVert,
  MdPayments,
  MdPendingActions,
  MdReceiptLong,
} from "react-icons/md";
import { useDeleteEvent, useSetEventApproval } from "@/hooks/use-events";
import type { NnakEvent } from "@/types/nnak";
import { fmtRange, useConfirm } from "./shared";

export interface HeroCounts {
  packages: number;
  bookings: number;
  attendees: number;
  scannedIn: number;
}

export default function EventHero({
  event,
  counts,
  onBack,
}: {
  event: NnakEvent;
  counts: HeroCounts;
  onBack: () => void;
}) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();
  const setApproval = useSetEventApproval();
  const { confirm, dialog } = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);

  const image = event.banner_image_url || event.cover_image_url;

  const toggleApproval = async () => {
    if (event.is_approved) {
      const ok = await confirm({
        title: "Withdraw approval?",
        body: "The event will stop being publicly bookable until it is approved again.",
        confirmLabel: "Withdraw",
      });
      if (!ok) return;
    }
    setApproval.mutate({ id: event.id, is_approved: !event.is_approved });
  };

  const removeEvent = async () => {
    const ok = await confirm({
      title: `Delete "${event.title}"?`,
      body: "Packages, agendas, bookings and attendees for this event go with it. This cannot be undone.",
    });
    if (ok)
      deleteEvent.mutate(event.id, {
        onSuccess: () => router.push("/nnak/events"),
      });
  };

  return (
    <div className="relative">
      {dialog}

      <div className="relative h-56 md:h-64 bg-gradient-to-br from-primary/80 via-primary to-primary-dark overflow-hidden">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-slate-950/10" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 bg-white/90 backdrop-blur text-slate-800 hover:bg-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
          >
            <MdArrowBack className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleApproval}
              disabled={setApproval.isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm backdrop-blur transition-colors disabled:opacity-60 ${
                event.is_approved
                  ? "bg-white/90 text-slate-700 hover:bg-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {event.is_approved ? (
                <>
                  <MdPendingActions className="w-4 h-4" /> Withdraw
                </>
              ) : (
                <>
                  <MdCheckCircle className="w-4 h-4" /> Approve
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Event actions"
                className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-lg shadow-sm"
              >
                <MdMoreVert className="w-5 h-5" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() =>
                      router.push(`/nnak/events/new?id=${event.id}`)
                    }
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <MdEdit className="w-4 h-4 text-slate-500" /> Edit event
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      removeEvent();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <MdDelete className="w-4 h-4" /> Delete event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                event.is_approved
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-400 text-amber-950"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {event.is_approved ? "Approved" : "Awaiting approval"}
            </span>
            <span className="inline-flex items-center text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
              {event.code}
            </span>
            {event.type && (
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">
                {event.type}
              </span>
            )}
            <span className="inline-flex items-center text-[11px] text-white/80">
              {fmtRange(event.start_date, event.end_date)}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-sm">
            {event.title}
          </h1>
          {event.theme && (
            <p className="text-sm text-white/85 mt-1 italic">{event.theme}</p>
          )}
        </div>
      </div>

      {/* Live figures — the header already carries the dates, code and status. */}
      <div className="px-4 -mt-5 relative z-[1]">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 overflow-hidden">
          <KpiCell
            icon={MdPayments}
            label="Packages"
            value={counts.packages}
            footer={counts.packages ? "On sale" : "None yet"}
          />
          <KpiCell
            icon={MdReceiptLong}
            label="Bookings"
            value={counts.bookings}
          />
          <KpiCell
            icon={MdConfirmationNumber}
            label="Attendees"
            value={counts.attendees}
          />
          <KpiCell
            icon={MdHowToReg}
            label="Scanned in"
            value={counts.scannedIn}
            footer={
              counts.attendees
                ? `${Math.round((counts.scannedIn / counts.attendees) * 100)}% turnout`
                : undefined
            }
            tone="ok"
          />
        </div>
      </div>
    </div>
  );
}

const KpiCell = ({
  icon: Icon = MdEvent,
  label,
  value,
  footer,
  tone = "default",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  footer?: string;
  tone?: "default" | "ok";
}) => (
  <div className="bg-white px-4 py-3 flex gap-3 items-start">
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        tone === "ok"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-primary/10 text-primary"
      }`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-slate-900 tabular-nums leading-tight">
        {value}
      </div>
      {footer && (
        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
          {footer}
        </div>
      )}
    </div>
  </div>
);
