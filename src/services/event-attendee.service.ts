// Event attendee endpoints:
//   GET  /admin|finance/events/{event}/attendees   list (booked + admin-added)
//   POST /admin/events/{event}/attendees           manually add (VIP/staff/...)
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateAttendeeInput,
  CreatedAttendee,
  EventAttendeeList,
  EventReadScope,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (scope: EventReadScope, eventId: string) =>
  `/${scope}/events/${eventId}/attendees`;

export const eventAttendeeService = {
  /**
   * Unlike the other listings this one paginates *inside* `data`, alongside a
   * `meta` block that also reports how many attendees have been scanned in.
   */
  list: async (
    scope: EventReadScope,
    eventId: string,
    params?: { page?: number; per_page?: number; search?: string },
  ): Promise<EventAttendeeList> => {
    const r = await unwrap<EventAttendeeList>(
      nnakApi.get(base(scope, eventId), { params }),
    );
    return { data: r?.data ?? [], meta: r?.meta };
  },

  create: async (
    eventId: string,
    input: CreateAttendeeInput,
  ): Promise<CreatedAttendee> =>
    unwrap<CreatedAttendee>(nnakApi.post(base("admin", eventId), input)),
};
