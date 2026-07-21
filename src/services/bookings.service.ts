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
 *   GET  .../bookings                 list my bookings
 *   GET  .../bookings/{id}            booking status with attendees
 *   POST .../bookings                 create { event_package_id, attendees[] }
 *   POST .../bookings/{id}/pay        initiate M-Pesa payment for the invoice
 *   POST .../bookings/{id}/cancel     cancel a pending-payment booking
 */
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BookingPaymentInit,
  BookingScope,
  CreateBookingInput,
  NnakPagination,
  StudentBooking,
  StudentBookingDetail,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

/** Public bookings live at the unprefixed root; the rest are role-prefixed. */
const base = (scope: BookingScope) =>
  scope === "public" ? "/bookings" : `/${scope}/bookings`;

export const bookingsService = {
  list: async (
    scope: BookingScope,
    params?: { page?: number; per_page?: number; status?: string },
  ): Promise<{ data: StudentBooking[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: StudentBooking[];
      pagination?: NnakPagination;
    }>(base(scope), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: (scope: BookingScope, id: string) =>
    unwrap<StudentBookingDetail>(nnakApi.get(`${base(scope)}/${id}`)),

  create: (scope: BookingScope, body: CreateBookingInput) =>
    unwrap<StudentBookingDetail>(nnakApi.post(base(scope), body)),

  pay: (scope: BookingScope, bookingId: string) =>
    unwrap<BookingPaymentInit>(
      nnakApi.post(`${base(scope)}/${bookingId}/pay`),
    ),

  cancel: (scope: BookingScope, bookingId: string) =>
    unwrap<StudentBookingDetail>(
      nnakApi.post(`${base(scope)}/${bookingId}/cancel`),
    ),
};
