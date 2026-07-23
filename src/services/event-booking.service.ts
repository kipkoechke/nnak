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
  AttendanceStats,
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

/**
 * The report serialises a scan differently from the scan/lookup endpoints:
 * the attendee is `attendee_name`, and `scanned_at` is "YYYY-MM-DD HH:mm:ss"
 * with no zone marker rather than an ISO instant. Normalising here keeps the
 * quirk in one place instead of in every screen that renders a scan.
 */
type RawAttendanceRecord = Omit<AttendanceRecord, "attendee_name"> & {
  attendee_name?: string;
  name?: string;
};

/** Every other timestamp in this API is UTC, so the bare form is read as UTC. */
const toIso = (value: string) => {
  if (!value) return value;
  const bare = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(value);
  return bare ? `${bare[1]}T${bare[2]}Z` : value;
};

const normaliseAttendanceRecord = (
  r: RawAttendanceRecord,
): AttendanceRecord => ({
  ...r,
  attendee_name: r.attendee_name ?? r.name ?? "—",
  scanned_at: toIso(r.scanned_at),
});

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
    const r = await nnakApi.get<
      Paginated<RawAttendanceRecord> & {
        meta?: { stats?: AttendanceStats };
      }
    >(`/${scope}/events/${eventId}/attendance`, { params });
    return {
      data: (r.data?.data ?? []).map(normaliseAttendanceRecord),
      pagination: r.data?.pagination,
      // Totals across every page — a client-side count of the current page
      // would understate both figures.
      stats: r.data?.meta?.stats,
    };
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
