"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { bookingsService } from "@/services/bookings.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import { useNnakMe } from "@/hooks/use-auth";
import type {
  BookingScope,
  CreateBookingInput,
  PayBookingInput,
} from "@/types/nnak";

/** Booking statuses that will never change again, so polling can stop. */
const SETTLED_STATUSES = ["paid", "cancelled", "expired"];

/** Picks the booking prefix that matches the signed-in role. */
export const useBookingScope = (): BookingScope => {
  const { data: me } = useNnakMe();
  if (!me) return "public";
  return me.role === "student" ? "student" : "member";
};

export const useMyBookings = (
  scope: BookingScope,
  params: { page?: number; per_page?: number; status?: string } = {},
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.bookings.list(scope, params as Record<string, unknown>),
    queryFn: () => bookingsService.list(scope, params),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled,
  });

/**
 * A single booking. While payment is outstanding the status is polled so the
 * UI reflects an M-Pesa confirmation without the user refreshing.
 */
export const useBooking = (
  id: string | undefined,
  opts?: { poll?: boolean },
) =>
  useQuery({
    queryKey: nqk.bookings.detail(id ?? ""),
    queryFn: () => bookingsService.getById(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      if (!opts?.poll) return false;
      const s = q.state.data?.status;
      return s && SETTLED_STATUSES.includes(String(s).toLowerCase())
        ? false
        : 4000;
    },
  });

export const useCreateBooking = (scope: BookingScope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookingInput) =>
      bookingsService.create(scope, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.bookings.scope(scope) });
      toast.success("Booking created — pay the invoice to confirm");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not create booking")),
  });
};

export const usePayBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      ...body
    }: { bookingId: string } & PayBookingInput) =>
      bookingsService.pay(bookingId, body),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.bookings.detail(v.bookingId) });
      toast.success("Payment request sent — check your phone");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not start payment")),
  });
};

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsService.cancel(bookingId),
    onSuccess: (_, bookingId) => {
      qc.invalidateQueries({ queryKey: nqk.bookings.all });
      qc.invalidateQueries({ queryKey: nqk.bookings.detail(bookingId) });
      toast.success("Booking cancelled");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not cancel booking")),
  });
};
