// Public event listing — no authentication required, and the same surface for
// every signed-in role (members, students and the public all browse here):
//   GET /events                     list (paginated, ilike search on title)
//   GET /events/{event}             detail, with packages inlined
//   GET /events/{event}/packages    packages only
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  EventPackage,
  NnakPagination,
  PublicEvent,
  PublicEventDetail,
} from "@/types/nnak";

interface PublicEventsResponse {
  success: boolean;
  data: PublicEvent[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const publicEventsService = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ data: PublicEvent[]; pagination?: NnakPagination }> => {
    const r = await nnakApi.get<PublicEventsResponse>("/events", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  detail: async (id: string): Promise<PublicEventDetail> =>
    unwrap<PublicEventDetail>(nnakApi.get(`/events/${id}`)),

  packages: async (id: string): Promise<EventPackage[]> =>
    unwrap<EventPackage[]>(nnakApi.get(`/events/${id}/packages`)),
};
