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

export const calendarService = {
  /** Public — no auth. Defaults to the current month server-side. */
  list: async (params: CalendarQuery = {}): Promise<CalendarItem[]> => {
    const r = await nnakApi.get<ApiEnvelope<CalendarItem[]>>("/calendar", {
      params,
    });
    return r.data?.data ?? [];
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
