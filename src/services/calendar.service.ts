// Calendar:
//   GET    /calendar?year=&month=       public — approved events + entries
//   POST   /admin/calendar              create an entry
//   PATCH  /admin/calendar/{entry}      update an entry
//   DELETE /admin/calendar/{entry}      remove an entry
//
// Entries are meetings, activities, holidays and general notices. Events are
// merged into the read for display but stay owned by the events module.
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CalendarEntry,
  CalendarItem,
  CreateCalendarEntryInput,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface CalendarQuery {
  year?: number;
  month?: number;
}

/**
 * Pull the items out of whatever `/calendar` returns.
 *
 * The route wraps the month in `{ year, month, total, items: [...] }`. A bare
 * array, a paginated `{ data: [...] }` and a split `entries` / `events` shape
 * are accepted too. Anything else yields an empty list — the screen spreads
 * this into a new array, and a stray object there throws and blanks the page
 * instead of merely showing nothing.
 */
const toItems = (payload: unknown): CalendarItem[] => {
  if (Array.isArray(payload)) return payload as CalendarItem[];
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;

  if (Array.isArray(p.items)) return p.items as CalendarItem[];
  if (Array.isArray(p.data)) return p.data as CalendarItem[];

  const entries = Array.isArray(p.entries) ? (p.entries as CalendarItem[]) : [];
  const events = Array.isArray(p.events) ? (p.events as CalendarItem[]) : [];
  if (entries.length || events.length) {
    // Tag the source when the API splits them, so the UI can still tell an
    // event (read-only, links out) from an editable entry.
    return [
      ...entries.map((e) => ({ ...e, source: e.source ?? "calendar" })),
      ...events.map((e) => ({
        ...e,
        source: e.source ?? "event",
        event_id: e.event_id ?? e.id,
      })),
    ];
  }
  return [];
};

export const calendarService = {
  /** Public — no auth. Defaults to the current month server-side. */
  list: async (params: CalendarQuery = {}): Promise<CalendarItem[]> => {
    const r = await nnakApi.get<ApiEnvelope<CalendarItem[]>>("/calendar", {
      params,
    });
    return toItems(r.data?.data ?? r.data);
  },

  create: async (input: CreateCalendarEntryInput): Promise<CalendarEntry> =>
    unwrap<CalendarEntry>(nnakApi.post("/admin/calendar", input)),

  update: async (
    id: string,
    input: Partial<CreateCalendarEntryInput>,
  ): Promise<CalendarEntry> =>
    unwrap<CalendarEntry>(nnakApi.patch(`/admin/calendar/${id}`, input)),

  remove: async (id: string): Promise<void> => {
    await nnakApi.delete(`/admin/calendar/${id}`);
  },
};
