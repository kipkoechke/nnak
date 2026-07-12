// Admin event booking + attendance endpoints:
//   GET  /admin/events/{event}/bookings          list bookings for an event
//   GET  /admin/bookings/{id}                     booking detail with attendees
//   POST /admin/events/{event}/attendance-scan    scan a ticket for check-in
//   GET  /admin/events/{event}/attendance-lookup  lookup attendee by ticket
//   GET  /admin/events/{event}/attendance         attendance report
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  AttendanceReport,
  AttendanceScanResult,
  EventAttendee,
  EventBooking,
  NnakPagination,
} from "@/types/nnak";

interface BookingsResponse {
  success: boolean;
  data: EventBooking[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const eventBookingService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number; status?: string; search?: string },
  ) => {
    const r = await nnakApi.get<BookingsResponse>(
      `/admin/events/${eventId}/bookings`,
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<EventBooking>(nnakApi.get(`/admin/bookings/${id}`)),

  // ── Attendance ────────────────────────────────────────────────────
  scan: async (
    eventId: string,
    ticketNumber: string,
  ): Promise<AttendanceScanResult> =>
    unwrap<AttendanceScanResult>(
      nnakApi.post(`/admin/events/${eventId}/attendance-scan`, {
        ticket_number: ticketNumber,
      }),
    ),

  lookup: async (
    eventId: string,
    ticketNumber: string,
  ): Promise<EventAttendee | null> =>
    unwrap<EventAttendee | null>(
      nnakApi.get(`/admin/events/${eventId}/attendance-lookup`, {
        params: { ticket_number: ticketNumber },
      }),
    ),

  report: async (eventId: string): Promise<AttendanceReport> =>
    unwrap<AttendanceReport>(
      nnakApi.get(`/admin/events/${eventId}/attendance`),
    ),
};
