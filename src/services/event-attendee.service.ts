// Event attendee endpoints:
//   GET  /admin/events/{event}/attendees        list (booked + admin-added)
//   POST /admin/events/{event}/attendees        manually add (VIP/staff/sponsor)
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateAttendeeInput,
  EventAttendee,
  NnakPagination,
} from "@/types/nnak";

interface AttendeesResponse {
  success: boolean;
  data: EventAttendee[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/attendees`;

export const eventAttendeeService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number; search?: string; type?: string },
  ) => {
    const r = await nnakApi.get<AttendeesResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: async (
    eventId: string,
    input: CreateAttendeeInput,
  ): Promise<EventAttendee> =>
    unwrap<EventAttendee>(nnakApi.post(base(eventId), input)),
};
