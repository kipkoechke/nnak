"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MdConfirmationNumber,
  MdEvent,
  MdHandshake,
  MdHowToReg,
  MdMic,
  MdPayments,
  MdQrCodeScanner,
  MdReceiptLong,
  MdSchedule,
  MdStore,
} from "react-icons/md";
import { useEvent } from "@/hooks/use-events";
import { useEventPackages } from "@/hooks/use-event-packages";
import { useAgendas } from "@/hooks/use-agendas";
import { useSpeakers } from "@/hooks/use-speakers";
import { useSponsors } from "@/hooks/use-sponsors";
import { useExhibitors } from "@/hooks/use-exhibitors";
import {
  useEventAttendees,
  useEventBookings,
  useEventScanners,
} from "@/hooks/use-event-operations";

import EventHero from "./_components/EventHero";
import OverviewTab from "./_components/OverviewTab";
import ProgrammeTab from "./_components/ProgrammeTab";
import SpeakersTab from "./_components/SpeakersTab";
import SponsorsTab from "./_components/SponsorsTab";
import ExhibitorsTab from "./_components/ExhibitorsTab";
import PackagesTab from "./_components/PackagesTab";
import BookingsTab from "./_components/BookingsTab";
import AttendeesTab from "./_components/AttendeesTab";
import AttendanceTab from "./_components/AttendanceTab";
import ScannersTab from "./_components/ScannersTab";

/* ─────────────────────────────────────────────────────────────────────────
 *  Tab structure
 *
 *  Groups mirror how the API nests its resources: an agenda owns its
 *  speakers and breakout rooms (so they live inside Programme, not beside
 *  it), while speakers, sponsors and exhibitors are flat event-level
 *  listings, and packages/bookings/attendance describe selling and running
 *  the door.
 * ────────────────────────────────────────────────────────────────────── */

type IconType = React.ComponentType<{ className?: string }>;

interface TabDef {
  key: string;
  label: string;
  icon: IconType;
}

interface TabGroup {
  key: string;
  label: string;
  icon: IconType;
  /** Which counts add up to the badge on the group button. */
  countKeys?: string[];
  tabs: TabDef[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    key: "overview",
    label: "Overview",
    icon: MdEvent,
    tabs: [{ key: "overview", label: "Overview", icon: MdEvent }],
  },
  {
    key: "programme",
    label: "Programme",
    icon: MdSchedule,
    countKeys: ["programme"],
    tabs: [{ key: "programme", label: "Programme", icon: MdSchedule }],
  },
  {
    key: "lineup",
    label: "Line-up",
    icon: MdMic,
    countKeys: ["speakers", "sponsors", "exhibitors"],
    tabs: [
      { key: "speakers", label: "Speakers", icon: MdMic },
      { key: "sponsors", label: "Sponsors", icon: MdHandshake },
      { key: "exhibitors", label: "Exhibitors", icon: MdStore },
    ],
  },
  {
    key: "registration",
    label: "Registration",
    icon: MdReceiptLong,
    countKeys: ["packages", "bookings"],
    tabs: [
      { key: "packages", label: "Packages", icon: MdPayments },
      { key: "bookings", label: "Bookings", icon: MdReceiptLong },
    ],
  },
  {
    key: "checkin",
    label: "Check-in",
    icon: MdHowToReg,
    countKeys: ["attendees"],
    tabs: [
      { key: "attendees", label: "Attendees", icon: MdConfirmationNumber },
      { key: "attendance", label: "Attendance", icon: MdHowToReg },
      { key: "scanners", label: "Scanners", icon: MdQrCodeScanner },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs.map((t) => t.key));

const groupForTab = (tabKey: string) =>
  TAB_GROUPS.find((g) => g.tabs.some((t) => t.key === tabKey)) ?? TAB_GROUPS[0];

/* ─────────────────────────────────────────────────────────────────────────
 *  Page
 * ────────────────────────────────────────────────────────────────────── */

export default function EventTabsPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const params = useSearchParams();

  // The tab lives in the URL so a refresh, a bookmark or the back button all
  // land where the admin left off.
  const requested = params.get("tab") ?? "";
  const tab = ALL_TABS.includes(requested) ? requested : "overview";
  const activeGroup = groupForTab(tab);

  const setTab = useCallback(
    (next: string) => {
      const q = new URLSearchParams(params.toString());
      q.set("tab", next);
      router.replace(`?${q.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const { data: event, isLoading } = useEvent(eventId);

  // Counts feed both the tab badges and the hero KPI strip.
  const { data: packagesData } = useEventPackages(eventId);
  const { data: agendasData } = useAgendas(eventId);
  const { data: speakersData } = useSpeakers(eventId);
  const { data: sponsorsData } = useSponsors(eventId);
  const { data: exhibitorsData } = useExhibitors(eventId);
  const { data: bookingsData } = useEventBookings(eventId);
  const { data: attendeesData } = useEventAttendees(eventId);
  const { data: scannersData } = useEventScanners(eventId);

  const counts: Record<string, number> = useMemo(
    () => ({
      packages: packagesData?.data?.length ?? 0,
      programme:
        agendasData?.pagination?.total ?? agendasData?.data?.length ?? 0,
      speakers: speakersData?.data?.length ?? 0,
      sponsors: sponsorsData?.data?.length ?? 0,
      exhibitors: exhibitorsData?.data?.length ?? 0,
      bookings:
        bookingsData?.pagination?.total ?? bookingsData?.data?.length ?? 0,
      attendees: attendeesData?.meta?.total ?? attendeesData?.data?.length ?? 0,
      scanners: scannersData?.length ?? 0,
    }),
    [
      packagesData,
      agendasData,
      speakersData,
      sponsorsData,
      exhibitorsData,
      bookingsData,
      attendeesData,
      scannersData,
    ],
  );

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
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
    <div className="flex flex-col bg-slate-50 min-h-full">
      <EventHero
        event={event}
        counts={{
          packages: counts.packages,
          bookings: counts.bookings,
          attendees: counts.attendees,
          scannedIn: attendeesData?.meta?.scanned_in ?? 0,
        }}
        onBack={() => router.push("/nnak/events")}
      />

      {/* Sticky nav — groups on top, panels of the active group below */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm mt-4">
        <div className="px-4 flex overflow-x-auto gap-5 no-scrollbar">
          {TAB_GROUPS.map((g) => {
            const active = activeGroup.key === g.key;
            const Icon = g.icon;
            const total = g.countKeys?.reduce(
              (sum, k) => sum + (counts[k] ?? 0),
              0,
            );
            return (
              <button
                key={g.key}
                onClick={() => setTab(g.tabs[0].key)}
                className={`group relative inline-flex items-center gap-2 py-3.5 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "text-primary font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    active
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {g.label}
                {!!total && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-px rounded-full tabular-nums ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {total}
                  </span>
                )}
                <span
                  className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-colors ${
                    active ? "bg-primary" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {activeGroup.tabs.length > 1 && (
          <div className="px-4 pb-3 -mt-0.5 flex overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg">
              {activeGroup.tabs.map((t) => {
                const active = tab === t.key;
                const Icon = t.icon;
                const count = counts[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-all ${
                      active
                        ? "bg-white text-slate-900 font-semibold shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        active ? "text-primary" : "text-slate-400"
                      }`}
                    />
                    {t.label}
                    {!!count && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-px rounded-full tabular-nums ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-200 text-slate-600"
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
        )}
      </div>

      <div className="px-4 py-6">
        {tab === "overview" && <OverviewTab event={event} />}
        {tab === "programme" && <ProgrammeTab eventId={eventId} />}
        {tab === "speakers" && <SpeakersTab eventId={eventId} />}
        {tab === "sponsors" && <SponsorsTab eventId={eventId} />}
        {tab === "exhibitors" && <ExhibitorsTab eventId={eventId} />}
        {tab === "packages" && <PackagesTab eventId={eventId} />}
        {tab === "bookings" && <BookingsTab eventId={eventId} />}
        {tab === "attendees" && <AttendeesTab eventId={eventId} />}
        {tab === "attendance" && <AttendanceTab eventId={eventId} />}
        {tab === "scanners" && <ScannersTab eventId={eventId} />}
      </div>
    </div>
  );
}
