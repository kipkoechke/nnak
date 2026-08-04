"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { bookingsService } from "@/services/bookings.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import { useNnakMe } from "@/hooks/use-auth";
import type { BookingScope, CreateBookingInput } from "@/types/nnak";

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
  scope: BookingScope,
  id: string | undefined,
  opts?: { poll?: boolean },
) =>
  useQuery({
    queryKey: nqk.bookings.detail(scope, id ?? ""),
    queryFn: () => bookingsService.getById(scope, id!),
    enabled: !!id,
    refetchInterval: (q) => {
      if (!opts?.poll) return false;
      const s = (q.state.data as { status?: string } | undefined)?.status;
      const settled = ["paid", "confirmed", "cancelled", "failed", "expired"];
      return s && settled.includes(String(s).toLowerCase()) ? false : 4000;
    },
  });

export const useCreateBooking = (scope: BookingScope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookingInput) =>
      bookingsService.create(scope, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.bookings.scope(scope) });
      toast.success("Booking created");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not create booking")),
  });
};

export const usePayBooking = (scope: BookingScope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsService.pay(scope, bookingId),
    onSuccess: (_, bookingId) => {
      qc.invalidateQueries({ queryKey: nqk.bookings.detail(scope, bookingId) });
      toast.success("Payment request sent — check your phone");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not start payment")),
  });
};

export const useCancelBooking = (scope: BookingScope) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsService.cancel(scope, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.bookings.scope(scope) });
      toast.success("Booking cancelled");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not cancel booking")),
  });
};
