// Member portal events endpoints:
//   GET /member/events                      paginated list
//   GET /member/events/{event}              event detail
//   GET /member/events/{event}/packages     event packages
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  MemberEvent,
  MemberEventDetail,
  MemberEventPackage,
  NnakPagination,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const memberEventsService = {
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
    }>("/member/events", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  detail: async (id: string): Promise<MemberEventDetail> =>
    unwrap<MemberEventDetail>(nnakApi.get(`/member/events/${id}`)),

  packages: async (id: string): Promise<MemberEventPackage[]> =>
    unwrap<MemberEventPackage[]>(nnakApi.get(`/member/events/${id}/packages`)),
};
