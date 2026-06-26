// Exhibitor endpoints (nested under event):
//   GET  /events/{event}/exhibitors         list
//   POST /events/{event}/exhibitors         create
//   GET  /events/{event}/exhibitors/{id}    detail
//   PATCH /events/{event}/exhibitors/{id}   update
//   DELETE /events/{event}/exhibitors/{id}  delete
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateExhibitorInput,
  Exhibitor,
  NnakPagination,
} from "@/types/nnak";

interface ExhibitorsResponse {
  success: boolean;
  data: Exhibitor[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/exhibitors`;

export const exhibitorService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<ExhibitorsResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<Exhibitor>(nnakApi.get(`${base(eventId)}/${id}`)),

  create: async (
    eventId: string,
    input: CreateExhibitorInput,
  ): Promise<Exhibitor> =>
    unwrap<Exhibitor>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateExhibitorInput>,
  ): Promise<Exhibitor> =>
    unwrap<Exhibitor>(nnakApi.patch(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
