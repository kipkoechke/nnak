// Back-office event booking + attendance endpoints. Reads are available under
// both /admin and /finance; the scanning writes are admin-only.
//   GET  /admin|finance/events/{event}/bookings           bookings for an event
//   GET  /admin|finance/bookings/{booking}                booking detail
//   GET  /admin|finance/events/{event}/attendance         attendance report
//   POST /admin/events/{event}/attendance/scan            record a scan
//   GET  /admin/events/{event}/attendance/lookup          look a ticket up
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  AttendanceLookupResult,
  AttendanceRecord,
  AttendanceScanResult,
  AttendanceType,
  EventBooking,
  EventBookingDetail,
  EventReadScope,
  NnakPagination,
} from "@/types/nnak";

interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const eventBookingService = {
  list: async (
    scope: EventReadScope,
    eventId: string,
    params?: {
      page?: number;
      per_page?: number;
      status?: string;
      /** Matches reference code, contact name or contact email. */
      search?: string;
    },
  ) => {
    const r = await nnakApi.get<Paginated<EventBooking>>(
      `/${scope}/events/${eventId}/bookings`,
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (scope: EventReadScope, id: string) =>
    unwrap<EventBookingDetail>(nnakApi.get(`/${scope}/bookings/${id}`)),

  // ── Attendance ────────────────────────────────────────────────────
  report: async (
    scope: EventReadScope,
    eventId: string,
    params?: {
      page?: number;
      per_page?: number;
      type?: AttendanceType;
      agenda_id?: string;
    },
  ) => {
    const r = await nnakApi.get<Paginated<AttendanceRecord>>(
      `/${scope}/events/${eventId}/attendance`,
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  scan: async (
    eventId: string,
    body: {
      ticket_number: string;
      /** Scopes the scan to a single session. */
      agenda_id?: string;
      type?: AttendanceType;
    },
  ): Promise<AttendanceScanResult> =>
    unwrap<AttendanceScanResult>(
      nnakApi.post(`/admin/events/${eventId}/attendance/scan`, body),
    ),

  lookup: async (
    eventId: string,
    ticketNumber: string,
  ): Promise<AttendanceLookupResult> =>
    unwrap<AttendanceLookupResult>(
      nnakApi.get(`/admin/events/${eventId}/attendance/lookup`, {
        params: { ticket_number: ticketNumber },
      }),
    ),
};
