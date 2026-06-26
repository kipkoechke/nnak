// Student portal events & bookings endpoints:
//   GET /student/events                       paginated list
//   GET /student/events/{event}               event detail
//   GET /student/events/{event}/packages      event packages
//   GET /student/bookings                     bookings list
//   GET /student/bookings/{booking}           booking detail
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  MemberEvent,
  MemberEventDetail,
  MemberEventPackage,
  NnakPagination,
  StudentBooking,
  StudentBookingDetail,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const studentEventsService = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: MemberEvent[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: MemberEvent[];
      pagination?: NnakPagination;
    }>("/student/events", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  detail: async (id: string): Promise<MemberEventDetail> =>
    unwrap<MemberEventDetail>(nnakApi.get(`/student/events/${id}`)),

  packages: async (id: string): Promise<MemberEventPackage[]> =>
    unwrap<MemberEventPackage[]>(nnakApi.get(`/student/events/${id}/packages`)),

  bookings: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<{ data: StudentBooking[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<{
      success: boolean;
      data: StudentBooking[];
      pagination?: NnakPagination;
    }>("/student/bookings", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  bookingDetail: async (id: string): Promise<StudentBookingDetail> =>
    unwrap<StudentBookingDetail>(nnakApi.get(`/student/bookings/${id}`)),
};
