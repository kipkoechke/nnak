/**
 * Event booking, payment and cancellation — role-scoped.
 *
 * The backend exposes the same booking surface under three prefixes, so the
 * scope is a parameter rather than three near-identical services:
 *   member  -> /member/bookings
 *   student -> /student/bookings
 *   public  -> /bookings            (unprefixed, for unauthenticated bookers)
 *
 * Endpoints (per scope)
 *   GET  .../bookings                 list my bookings (paginated)
 *   POST .../bookings                 create { event_package_id, attendees[] }
 *
 * Reads and actions on a single booking are only mounted unprefixed:
 *   GET  /bookings/{id}               booking detail with attendees + invoice
 *   POST /bookings/{id}/pay           initiate the M-Pesa STK push
 *   POST /bookings/{id}/cancel        cancel a pending-payment booking
 */
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BookingPaymentInit,
  BookingScope,
  BookingStatus,
  CreateBookingInput,
  MyBooking,
  MyBookingDetail,
  NnakPagination,
  PayBookingInput,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

/** Create and detail nest the record one level deeper, under `booking`. */
const unwrapBooking = (
  p: Promise<{ data: ApiEnvelope<{ booking: MyBookingDetail }> }>,
) => p.then((r) => r.data.data.booking);

/** Public bookings live at the unprefixed root; the rest are role-prefixed. */
const base = (scope: BookingScope) =>
  scope === "public" ? "/bookings" : `/${scope}/bookings`;

export const bookingsService = {
  list: async (
    scope: BookingScope,
    params?: { page?: number; per_page?: number; status?: string },
  ): Promise<{ data: MyBooking[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: MyBooking[];
      pagination?: NnakPagination;
    }>(base(scope), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: (scope: BookingScope, body: CreateBookingInput) =>
    unwrapBooking(nnakApi.post(base(scope), body)),

  getById: (id: string) => unwrapBooking(nnakApi.get(`/bookings/${id}`)),

  /** Omitting `phone_number` bills the phone captured on the booking. */
  pay: (id: string, body?: PayBookingInput) =>
    unwrap<BookingPaymentInit>(nnakApi.post(`/bookings/${id}/pay`, body ?? {})),

  cancel: (id: string) =>
    unwrap<{ id: string; reference_code: string; status: BookingStatus }>(
      nnakApi.post(`/bookings/${id}/cancel`),
    ),
};
