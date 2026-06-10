"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdAdd,
  MdArrowBack,
  MdBusinessCenter,
  MdCalendarToday,
  MdCampaign,
  MdClose,
  MdDelete,
  MdEdit,
  MdEvent,
  MdGroups,
  MdHandshake,
  MdLink,
  MdLocationOn,
  MdMeetingRoom,
  MdMic,
  MdMoreVert,
  MdOpenInNew,
  MdPayments,
  MdPerson,
  MdRecordVoiceOver,
  MdSchedule,
  MdStore,
} from "react-icons/md";
import { useEvent, useDeleteEvent } from "@/hooks/use-events";
import {
  useAgendas,
  useCreateAgenda,
  useUpdateAgenda,
  useDeleteAgenda,
} from "@/hooks/use-agendas";
import {
  useSpeakers,
  useCreateSpeaker,
  useDeleteSpeaker,
} from "@/hooks/use-speakers";
import {
  useBreakoutRooms,
  useCreateBreakoutRoom,
  useUpdateBreakoutRoom,
  useDeleteBreakoutRoom,
} from "@/hooks/use-breakout-rooms";
import {
  useAgendaSpeakers,
  useCreateAgendaSpeaker,
  useDeleteAgendaSpeaker,
} from "@/hooks/use-agenda-speakers";
import {
  useBreakoutSpeakers,
  useCreateBreakoutSpeaker,
  useDeleteBreakoutSpeaker,
} from "@/hooks/use-breakout-speakers";
import {
  useSponsors,
  useCreateSponsor,
  useDeleteSponsor,
} from "@/hooks/use-sponsors";
import {
  useExhibitors,
  useCreateExhibitor,
  useDeleteExhibitor,
} from "@/hooks/use-exhibitors";
import type { NnakEvent } from "@/types/nnak";

/* ─────────────────────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────────────────── */

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

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const fmtRange = (start?: string, end?: string) => {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return fmtDate(start);
  return `${fmtDate(start)} → ${fmtDate(end)}`;
};

/* ─────────────────────────────────────────────────────────────────────────
 *  Reusable bits
 * ────────────────────────────────────────────────────────────────────── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}
const Modal = ({ open, onClose, title, children, size = "md" }: ModalProps) => {
  if (!open) return null;
  const maxW =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl shadow-xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
    />
  </div>
);

const TextArea = ({
  label,
  value,
  onChange,
  rows = 3,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
    />
  </div>
);

const SectionHeader = ({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
}) => (
  <div className="flex items-end justify-between gap-3">
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {typeof count === "number" && (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    {action}
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 px-6 text-center">
    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {description && (
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const AddBtn = ({
  onClick,
  label = "Add",
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 shadow-sm"
  >
    <MdAdd className="w-4 h-4" /> {label}
  </button>
);

const Avatar = ({ name, src }: { name: string; src?: string | null }) => {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="w-12 h-12 rounded-full object-cover border border-slate-200"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
      {initials || <MdPerson className="w-5 h-5" />}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
 *  Tabs
 * ────────────────────────────────────────────────────────────────────── */

interface TabDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { key: "overview", label: "Overview", icon: MdEvent },
  { key: "agendas", label: "Agendas", icon: MdSchedule },
  { key: "speakers", label: "Speakers", icon: MdMic },
  { key: "agendaSpeakers", label: "Agenda Speakers", icon: MdRecordVoiceOver },
  { key: "breakoutRooms", label: "Breakout Rooms", icon: MdMeetingRoom },
  { key: "breakoutSpeakers", label: "Breakout Speakers", icon: MdGroups },
  { key: "sponsors", label: "Sponsors & Partners", icon: MdHandshake },
  { key: "exhibitors", label: "Exhibitors", icon: MdStore },
];

/* ─────────────────────────────────────────────────────────────────────────
 *  Main page
 * ────────────────────────────────────────────────────────────────────── */

export default function EventTabsPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("overview");
  const { data: event, isLoading } = useEvent(eventId);

  // Pull counts for the tab badges
  const { data: agendasData } = useAgendas(eventId);
  const { data: speakersData } = useSpeakers(eventId);
  const { data: sponsorsData } = useSponsors(eventId);
  const { data: exhibitorsData } = useExhibitors(eventId);

  const counts: Record<string, number> = useMemo(
    () => ({
      agendas: agendasData?.data?.length ?? 0,
      speakers: speakersData?.data?.length ?? 0,
      sponsors: sponsorsData?.data?.length ?? 0,
      exhibitors: exhibitorsData?.data?.length ?? 0,
    }),
    [agendasData, speakersData, sponsorsData, exhibitorsData],
  );

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-md animate-pulse" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-slate-600">Event not found.</p>
        <button
          onClick={() => router.push("/nnak/events")}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <EventHero event={event} onBack={() => router.back()} />

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
        <div className="px-4 -mb-px flex overflow-x-auto gap-1 no-scrollbar">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            const count = counts[t.key as keyof typeof counts];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-6">
        {tab === "overview" && <OverviewTab event={event} />}
        {tab === "agendas" && <AgendasTab eventId={eventId} />}
        {tab === "speakers" && <SpeakersTab eventId={eventId} />}
        {tab === "agendaSpeakers" && <AgendaSpeakersTab eventId={eventId} />}
        {tab === "breakoutRooms" && <BreakoutRoomsTab eventId={eventId} />}
        {tab === "breakoutSpeakers" && (
          <BreakoutSpeakersTab eventId={eventId} />
        )}
        {tab === "sponsors" && <SponsorsTab eventId={eventId} />}
        {tab === "exhibitors" && <ExhibitorsTab eventId={eventId} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Hero
 * ────────────────────────────────────────────────────────────────────── */

function EventHero({
  event,
  onBack,
}: {
  event: NnakEvent;
  onBack: () => void;
}) {
  const router = useRouter();
  const deleteEvent = useDeleteEvent();
  const [menuOpen, setMenuOpen] = useState(false);

  const cap = (event.metadata as Record<string, unknown> | null)?.capacity as
    | number
    | undefined;
  const registrants = event.registrants_count || 0;
  const attended = event.attended_count || 0;
  const revenue = event.revenue_total || 0;

  return (
    <div className="relative">
      <div className="relative h-56 md:h-64 bg-gradient-to-br from-primary/80 via-primary to-primary-dark overflow-hidden">
        {event.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 bg-white/90 backdrop-blur text-slate-800 hover:bg-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
          >
            <MdArrowBack className="w-4 h-4" /> Back
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-md shadow-sm"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-20"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => router.push(`/nnak/events/new?id=${event.id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <MdEdit className="w-4 h-4 text-slate-500" /> Edit event
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this event? This cannot be undone.")) {
                      deleteEvent.mutate(event.id, {
                        onSuccess: () => router.push("/nnak/events"),
                      });
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <MdDelete className="w-4 h-4" /> Delete event
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_TONE[event.status] || STATUS_TONE.draft}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[event.status] || STATUS_DOT.draft}`}
              />
              {event.status}
            </span>
            <span className="inline-flex items-center text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
              {event.code}
            </span>
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">
              {event.type}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {event.title}
          </h1>
          {event.theme && (
            <p className="text-sm opacity-90 mt-1 italic">{event.theme}</p>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-4 -mt-5 relative z-[1]">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden">
          <KpiCell
            icon={MdCalendarToday}
            label="When"
            value={fmtRange(event.start_date, event.end_date)}
          />
          <KpiCell
            icon={MdLocationOn}
            label="Where"
            value={event.location || "—"}
          />
          <KpiCell
            icon={MdGroups}
            label="Registrants"
            value={
              cap ? `${registrants} / ${cap}` : registrants.toLocaleString()
            }
            footer={`${attended} attended`}
          />
          <KpiCell
            icon={MdPayments}
            label="Revenue"
            value={`KES ${revenue.toLocaleString()}`}
          />
        </div>
      </div>
    </div>
  );
}

const KpiCell = ({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  footer?: string;
}) => (
  <div className="bg-white px-4 py-3 flex gap-3 items-start">
    <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900 truncate">
        {value}
      </div>
      {footer && (
        <div className="text-[11px] text-slate-500 mt-0.5">{footer}</div>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
 *  Overview Tab
 * ────────────────────────────────────────────────────────────────────── */

function OverviewTab({ event }: { event: NnakEvent }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            About this event
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
            {event.description || "No description yet."}
          </p>
        </Card>

        {event.pricing && event.pricing.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Pricing tiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.pricing.map((p, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:border-primary transition-colors"
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      {p.category_code.replace(/_/g, " ")}
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      KES {Number(p.fee).toLocaleString()}
                    </div>
                  </div>
                  <MdPayments className="w-5 h-5 text-slate-300" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Metadata
            </h3>
            <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-md overflow-auto max-h-60">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Schedule
          </h3>
          <div className="space-y-2 text-sm">
            <Row
              label="Starts"
              value={`${fmtDate(event.start_date)} ${fmtTime(event.start_date)}`}
            />
            <Row
              label="Ends"
              value={`${fmtDate(event.end_date)} ${fmtTime(event.end_date)}`}
            />
            <Row label="Location" value={event.location || "—"} />
            {event.location_coordinates && (
              <Row
                label="Coordinates"
                value={`${event.location_coordinates.lat}, ${event.location_coordinates.lng}`}
              />
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Identifiers
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Code" value={event.code} mono />
            <Row label="Type" value={event.type} cap />
            <Row label="Status" value={event.status} cap />
          </div>
        </Card>
      </div>
    </div>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    {children}
  </div>
);

const Row = ({
  label,
  value,
  mono,
  cap,
}: {
  label: string;
  value: string;
  mono?: boolean;
  cap?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span
      className={`text-sm text-slate-900 font-medium ${mono ? "font-mono" : ""} ${cap ? "capitalize" : ""}`}
    >
      {value}
    </span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
 *  Agendas Tab
 * ────────────────────────────────────────────────────────────────────── */

function AgendasTab({ eventId }: { eventId: string }) {
  const { data: agendasData, isLoading } = useAgendas(eventId);
  const createAgenda = useCreateAgenda();
  const updateAgenda = useUpdateAgenda();
  const deleteAgenda = useDeleteAgenda();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "general",
  });

  const reset = () => {
    setForm({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      type: "general",
    });
    setEditId(null);
    setModalOpen(false);
  };

  const agendas = agendasData?.data ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      event_id: eventId,
      title: form.title,
      description: form.description,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      type: form.type,
    };
    if (editId)
      updateAgenda.mutate(
        { eventId, id: editId, input: payload },
        { onSuccess: reset },
      );
    else createAgenda.mutate({ eventId, input: payload }, { onSuccess: reset });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Agendas"
        description="Schedule sessions, panels and workshops"
        count={agendas.length}
        action={
          <AddBtn
            onClick={() => {
              setEditId(null);
              setForm({
                title: "",
                description: "",
                start_time: "",
                end_time: "",
                type: "general",
              });
              setModalOpen(true);
            }}
            label="New agenda"
          />
        }
      />

      {isLoading ? (
        <SkeletonList />
      ) : agendas.length === 0 ? (
        <EmptyState
          icon={MdSchedule}
          title="No agendas yet"
          description="Build your event timeline by adding sessions, panels and workshops."
          action={
            <AddBtn
              onClick={() => setModalOpen(true)}
              label="Add the first agenda"
            />
          }
        />
      ) : (
        <div className="space-y-2">
          {agendas
            .slice()
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((a) => (
              <div
                key={a.id}
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">
                      {new Date(a.start_time).toLocaleString("en-GB", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-xl font-bold text-slate-900 leading-none">
                      {new Date(a.start_time).getDate()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {fmtTime(a.start_time)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {a.title}
                      </h4>
                      <span className="text-[10px] uppercase tracking-wide font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {a.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                    </div>
                    {a.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditId(a.id);
                        setForm({
                          title: a.title,
                          description: a.description || "",
                          start_time: a.start_time?.slice(0, 16) ?? "",
                          end_time: a.end_time?.slice(0, 16) ?? "",
                          type: a.type,
                        });
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary"
                      title="Edit"
                    >
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete agenda "${a.title}"?`))
                          deleteAgenda.mutate(a.id);
                      }}
                      className="p-2 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"
                      title="Delete"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit agenda" : "New agenda"}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            required
            placeholder="e.g. Opening Keynote"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="What is this session about?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start"
              type="datetime-local"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
              required
            />
            <Field
              label="End"
              type="datetime-local"
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              {["keynote", "panel", "workshop", "breakout", "general"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAgenda.isPending || updateAgenda.isPending}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createAgenda.isPending || updateAgenda.isPending
                ? "Saving…"
                : editId
                  ? "Save changes"
                  : "Create agenda"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Speakers Tab
 * ────────────────────────────────────────────────────────────────────── */

function SpeakersTab({ eventId }: { eventId: string }) {
  const { data: speakersData, isLoading } = useSpeakers(eventId);
  const createSpeaker = useCreateSpeaker();
  const deleteSpeaker = useDeleteSpeaker();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    organization: "",
    bio: "",
    photo_url: "",
  });

  const reset = () => {
    setForm({ name: "", title: "", organization: "", bio: "", photo_url: "" });
    setModalOpen(false);
  };

  const speakers = speakersData?.data ?? [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Speakers"
        description="Build the line-up that will appear on the event"
        count={speakers.length}
        action={
          <AddBtn onClick={() => setModalOpen(true)} label="New speaker" />
        }
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : speakers.length === 0 ? (
        <EmptyState
          icon={MdMic}
          title="No speakers yet"
          description="Add speakers, then link them to agendas and breakout rooms in the next tabs."
          action={
            <AddBtn
              onClick={() => setModalOpen(true)}
              label="Add the first speaker"
            />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {speakers.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:border-primary hover:shadow-sm transition-all"
            >
              <Avatar name={s.name} src={s.photo_url} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {s.name}
                </h4>
                {s.title && (
                  <div className="text-xs text-slate-600 truncate">
                    {s.title}
                  </div>
                )}
                {s.organization && (
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.organization}
                  </div>
                )}
                {s.bio && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {s.bio}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete speaker ${s.name}?`))
                    deleteSpeaker.mutate({ eventId, id: s.id });
                }}
                className="self-start p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <MdDelete className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={reset} title="New speaker" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSpeaker.mutate(
              { eventId, input: { event_id: eventId, ...form, links: {} } },
              { onSuccess: reset },
            );
          }}
          className="space-y-3"
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              placeholder="Chief Nursing Officer"
            />
            <Field
              label="Organization"
              value={form.organization}
              onChange={(v) => setForm({ ...form, organization: v })}
            />
          </div>
          <Field
            label="Photo URL"
            value={form.photo_url}
            onChange={(v) => setForm({ ...form, photo_url: v })}
            placeholder="https://…"
          />
          <TextArea
            label="Bio"
            value={form.bio}
            onChange={(v) => setForm({ ...form, bio: v })}
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSpeaker.isPending}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createSpeaker.isPending ? "Saving…" : "Add speaker"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Agenda Speakers Tab
 * ────────────────────────────────────────────────────────────────────── */

function AgendaSpeakersTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas(eventId);
  const { data: speakersData } = useSpeakers(eventId);
  const agendas = agendasData?.data ?? [];
  const speakers = speakersData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState<string>("");
  const [role, setRole] = useState<string>("speaker");

  const { data: linksData, isLoading } = useAgendaSpeakers(eventId, agendaId);
  const createLink = useCreateAgendaSpeaker();
  const deleteLink = useDeleteAgendaSpeaker();

  const links = linksData?.data ?? [];
  const speakerById = (id: string) => speakers.find((s) => s.id === id);
  const selectedAgenda = agendas.find((a) => a.id === agendaId);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Agenda Speakers"
        description="Link speakers to specific agenda sessions"
      />

      {/* Agenda picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Step 1 — pick an agenda
        </label>
        {agendas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add some agendas first, then come back to assign speakers.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {agendas.map((a) => {
              const active = a.id === agendaId;
              return (
                <button
                  key={a.id}
                  onClick={() => setAgendaId(a.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {fmtDate(a.start_time)} · {fmtTime(a.start_time)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Link form + list */}
      {agendaId && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Step 2 — link a speaker to{" "}
              <span className="text-slate-900 font-semibold">
                {selectedAgenda?.title}
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">— Pick a speaker —</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role (speaker, moderator, panelist)"
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <button
                disabled={!speakerId || createLink.isPending}
                onClick={() =>
                  createLink.mutate(
                    {
                      eventId,
                      agendaId,
                      input: {
                        agenda_id: agendaId,
                        speaker_id: speakerId,
                        role,
                      },
                    },
                    {
                      onSuccess: () => {
                        setSpeakerId("");
                        setRole("speaker");
                      },
                    },
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <MdLink className="w-4 h-4" />{" "}
                {createLink.isPending ? "Linking…" : "Link speaker"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <SkeletonList />
          ) : links.length === 0 ? (
            <EmptyState
              icon={MdRecordVoiceOver}
              title="No speakers linked yet"
              description="Pick a speaker above and link them to this agenda."
            />
          ) : (
            <div className="space-y-2">
              {links.map((l) => {
                const sp = l.speaker ?? speakerById(l.speaker_id);
                return (
                  <div
                    key={l.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                  >
                    <Avatar
                      name={sp?.name || l.speaker_id}
                      src={sp?.photo_url}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {sp?.name ?? l.speaker_id}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {sp?.title}
                        {sp?.organization ? ` · ${sp.organization}` : ""}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {l.role}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm("Unlink this speaker from the agenda?"))
                          deleteLink.mutate({ eventId, agendaId, id: l.id });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Unlink"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Breakout Rooms Tab
 * ────────────────────────────────────────────────────────────────────── */

function BreakoutRoomsTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas(eventId);
  const agendas = agendasData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const { data: roomsData, isLoading } = useBreakoutRooms(eventId, agendaId);
  const createRoom = useCreateBreakoutRoom();
  const updateRoom = useUpdateBreakoutRoom();
  const deleteRoom = useDeleteBreakoutRoom();

  const empty = { name: "", description: "", tag: "", location: "" };
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const reset = () => {
    setEditId(null);
    setForm(empty);
    setModalOpen(false);
  };

  const rooms = roomsData?.data ?? [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Breakout Rooms"
        description="Organise smaller, parallel sessions for each agenda"
        count={rooms.length}
        action={
          agendaId ? (
            <AddBtn
              onClick={() => {
                setEditId(null);
                setForm(empty);
                setModalOpen(true);
              }}
              label="New room"
            />
          ) : null
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Step 1 — pick an agenda
        </label>
        {agendas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add agendas first; rooms hang off them.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {agendas.map((a) => {
              const active = a.id === agendaId;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setAgendaId(a.id);
                    reset();
                  }}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {fmtDate(a.start_time)} · {fmtTime(a.start_time)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {agendaId &&
        (isLoading ? (
          <SkeletonList />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={MdMeetingRoom}
            title="No breakout rooms yet"
            description="Add a room for this agenda — then assign speakers in the next tab."
            action={
              <AddBtn onClick={() => setModalOpen(true)} label="Add a room" />
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <MdMeetingRoom className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-slate-900 truncate">
                        {r.name}
                      </h4>
                    </div>
                    {r.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MdLocationOn className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{r.location}</span>
                      </div>
                    )}
                    {r.tag && (
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {r.tag}
                      </span>
                    )}
                    {r.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditId(r.id);
                        setForm({
                          name: r.name,
                          description: r.description,
                          tag: r.tag,
                          location: r.location,
                        });
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-primary rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete room "${r.name}"?`))
                          deleteRoom.mutate({ eventId, agendaId, id: r.id });
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      <Modal
        open={modalOpen}
        onClose={reset}
        title={editId ? "Edit breakout room" : "New breakout room"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editId)
              updateRoom.mutate(
                { eventId, agendaId, id: editId, input: form },
                { onSuccess: reset },
              );
            else
              createRoom.mutate(
                { eventId, agendaId, input: { agenda_id: agendaId, ...form } },
                { onSuccess: reset },
              );
          }}
          className="space-y-3"
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="Room 3, Wing B"
            />
            <Field
              label="Tag"
              value={form.tag}
              onChange={(v) => setForm({ ...form, tag: v })}
              placeholder="paediatrics"
            />
          </div>
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRoom.isPending || updateRoom.isPending}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createRoom.isPending || updateRoom.isPending
                ? "Saving…"
                : editId
                  ? "Save changes"
                  : "Add room"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Breakout Speakers Tab
 * ────────────────────────────────────────────────────────────────────── */

function BreakoutSpeakersTab({ eventId }: { eventId: string }) {
  const { data: agendasData } = useAgendas(eventId);
  const { data: speakersData } = useSpeakers(eventId);
  const agendas = agendasData?.data ?? [];
  const speakers = speakersData?.data ?? [];

  const [agendaId, setAgendaId] = useState<string>("");
  const { data: roomsData } = useBreakoutRooms(eventId, agendaId);
  const rooms = roomsData?.data ?? [];

  const [roomId, setRoomId] = useState<string>("");
  const [speakerId, setSpeakerId] = useState<string>("");
  const [role, setRole] = useState<string>("speaker");

  const { data: linksData, isLoading } = useBreakoutSpeakers(
    eventId,
    agendaId,
    roomId,
  );
  const createLink = useCreateBreakoutSpeaker();
  const deleteLink = useDeleteBreakoutSpeaker();

  const links = linksData?.data ?? [];
  const speakerById = (id: string) => speakers.find((s) => s.id === id);
  const selectedRoom = rooms.find((r) => r.id === roomId);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Breakout Speakers"
        description="Link speakers to specific breakout rooms"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Step 1 — agenda
          </label>
          <select
            value={agendaId}
            onChange={(e) => {
              setAgendaId(e.target.value);
              setRoomId("");
            }}
            className="w-full md:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— Pick an agenda —</option>
            {agendas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        {agendaId && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Step 2 — breakout room
            </label>
            {rooms.length === 0 ? (
              <p className="text-xs text-slate-500">
                No breakout rooms for this agenda yet. Add some in the Breakout
                Rooms tab.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rooms.map((r) => {
                  const active = r.id === roomId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRoomId(r.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary text-slate-900 font-semibold"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {r.name}
                      {r.tag && (
                        <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
                          {r.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {roomId && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Step 3 — link a speaker to{" "}
              <span className="text-slate-900 font-semibold">
                {selectedRoom?.name}
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">— Pick a speaker —</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role"
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
              <button
                disabled={!speakerId || createLink.isPending}
                onClick={() =>
                  createLink.mutate(
                    {
                      eventId,
                      agendaId,
                      breakoutRoomId: roomId,
                      input: {
                        breakout_room_id: roomId,
                        speaker_id: speakerId,
                        role,
                      },
                    },
                    {
                      onSuccess: () => {
                        setSpeakerId("");
                        setRole("speaker");
                      },
                    },
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <MdLink className="w-4 h-4" />{" "}
                {createLink.isPending ? "Linking…" : "Link speaker"}
              </button>
            </div>
          </div>
        )}
      </div>

      {roomId &&
        (isLoading ? (
          <SkeletonList />
        ) : links.length === 0 ? (
          <EmptyState
            icon={MdGroups}
            title="No speakers in this room yet"
            description="Pick a speaker above and link them to this breakout room."
          />
        ) : (
          <div className="space-y-2">
            {links.map((l) => {
              const sp = l.speaker ?? speakerById(l.speaker_id);
              return (
                <div
                  key={l.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                >
                  <Avatar name={sp?.name || l.speaker_id} src={sp?.photo_url} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {sp?.name ?? l.speaker_id}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {sp?.title}
                      {sp?.organization ? ` · ${sp.organization}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {l.role}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Unlink this speaker?"))
                        deleteLink.mutate({
                          eventId,
                          agendaId,
                          breakoutRoomId: roomId,
                          id: l.id,
                        });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Unlink"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Sponsors Tab
 * ────────────────────────────────────────────────────────────────────── */

const SPONSOR_TONE: Record<string, string> = {
  platinum: "bg-slate-100 text-slate-800 border-slate-300",
  gold: "bg-amber-50 text-amber-800 border-amber-200",
  silver: "bg-zinc-100 text-zinc-700 border-zinc-200",
  bronze: "bg-orange-50 text-orange-700 border-orange-200",
  partner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  media: "bg-violet-50 text-violet-700 border-violet-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

function SponsorsTab({ eventId }: { eventId: string }) {
  const { data: sponsorsData, isLoading } = useSponsors(eventId);
  const createSponsor = useCreateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website_url: "",
    category: "platinum",
    is_partner: false,
    description: "",
    logo_url: "",
  });

  const reset = () => {
    setForm({
      name: "",
      website_url: "",
      category: "platinum",
      is_partner: false,
      description: "",
      logo_url: "",
    });
    setModalOpen(false);
  };

  const sponsors = sponsorsData?.data ?? [];
  const grouped = useMemo(() => {
    const m = new Map<string, typeof sponsors>();
    sponsors.forEach((s) => {
      const k = s.category || "other";
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    });
    return Array.from(m.entries()).sort(
      ([a], [b]) =>
        [
          "platinum",
          "gold",
          "silver",
          "bronze",
          "partner",
          "media",
          "other",
        ].indexOf(a) -
        [
          "platinum",
          "gold",
          "silver",
          "bronze",
          "partner",
          "media",
          "other",
        ].indexOf(b),
    );
  }, [sponsors]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Sponsors & Partners"
        description="Recognise the organisations backing this event"
        count={sponsors.length}
        action={
          <AddBtn onClick={() => setModalOpen(true)} label="New sponsor" />
        }
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : sponsors.length === 0 ? (
        <EmptyState
          icon={MdHandshake}
          title="No sponsors or partners yet"
          description="Add the organisations supporting this event so they show on the public page."
          action={
            <AddBtn onClick={() => setModalOpen(true)} label="Add a sponsor" />
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs uppercase font-semibold text-slate-500 tracking-wide mb-2">
                {category}{" "}
                <span className="text-slate-400">· {items.length}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all flex gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {s.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logo_url}
                          alt={s.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <MdBusinessCenter className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {s.name}
                        </h4>
                        {s.is_partner && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            Partner
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded-full border ${
                          SPONSOR_TONE[s.category] || SPONSOR_TONE.other
                        }`}
                      >
                        {s.category}
                      </span>
                      {s.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      {s.website_url && (
                        <a
                          href={s.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                        >
                          Visit website <MdOpenInNew className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete sponsor ${s.name}?`))
                          deleteSponsor.mutate({ eventId, id: s.id });
                      }}
                      className="self-start p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={reset}
        title="New sponsor / partner"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSponsor.mutate(
              { eventId, input: { event_id: eventId, ...form, metadata: {} } },
              { onSuccess: reset },
            );
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tier
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                {[
                  "platinum",
                  "gold",
                  "silver",
                  "bronze",
                  "partner",
                  "media",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Website"
              value={form.website_url}
              onChange={(v) => setForm({ ...form, website_url: v })}
              placeholder="https://…"
            />
            <Field
              label="Logo URL"
              value={form.logo_url}
              onChange={(v) => setForm({ ...form, logo_url: v })}
              placeholder="https://…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_partner}
              onChange={(e) =>
                setForm({ ...form, is_partner: e.target.checked })
              }
              className="accent-primary"
            />
            Mark as long-term partner
          </label>
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSponsor.isPending}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createSponsor.isPending ? "Saving…" : "Add sponsor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Exhibitors Tab
 * ────────────────────────────────────────────────────────────────────── */

function ExhibitorsTab({ eventId }: { eventId: string }) {
  const { data: exhibitorsData, isLoading } = useExhibitors(eventId);
  const createExhibitor = useCreateExhibitor();
  const deleteExhibitor = useDeleteExhibitor();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    booth: "",
  });

  const reset = () => {
    setForm({ name: "", description: "", logo_url: "", booth: "" });
    setModalOpen(false);
  };

  const exhibitors = exhibitorsData?.data ?? [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Exhibitors"
        description="Vendors & organisations showcasing on the event floor"
        count={exhibitors.length}
        action={
          <AddBtn onClick={() => setModalOpen(true)} label="New exhibitor" />
        }
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : exhibitors.length === 0 ? (
        <EmptyState
          icon={MdStore}
          title="No exhibitors yet"
          description="Add the organisations that will have stands at the event."
          action={
            <AddBtn
              onClick={() => setModalOpen(true)}
              label="Add an exhibitor"
            />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {exhibitors.map((ex) => {
            const booth = (ex.metadata as Record<string, unknown> | null)
              ?.booth;
            return (
              <div
                key={ex.id}
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all flex gap-3"
              >
                <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {ex.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ex.logo_url}
                      alt={ex.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <MdStore className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {ex.name}
                  </h4>
                  {typeof booth === "string" && booth && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MdCampaign className="w-3.5 h-3.5" />
                      Booth {booth}
                    </div>
                  )}
                  {ex.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                      {ex.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete exhibitor ${ex.name}?`))
                      deleteExhibitor.mutate({ eventId, id: ex.id });
                  }}
                  className="self-start p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <MdDelete className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={reset} title="New exhibitor" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExhibitor.mutate(
              {
                eventId,
                input: {
                  event_id: eventId,
                  name: form.name,
                  description: form.description,
                  logo_url: form.logo_url,
                  metadata: form.booth ? { booth: form.booth } : {},
                },
              },
              { onSuccess: reset },
            );
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Field
              label="Booth"
              value={form.booth}
              onChange={(v) => setForm({ ...form, booth: v })}
              placeholder="A12"
            />
          </div>
          <Field
            label="Logo URL"
            value={form.logo_url}
            onChange={(v) => setForm({ ...form, logo_url: v })}
            placeholder="https://…"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-slate-300 rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExhibitor.isPending}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createExhibitor.isPending ? "Saving…" : "Add exhibitor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Skeletons
 * ────────────────────────────────────────────────────────────────────── */

const SkeletonList = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
      >
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    ))}
  </div>
);

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse"
      >
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
