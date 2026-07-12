// Event package (ticket tier) endpoints, nested under an event:
//   GET    /admin/events/{event}/packages        list
//   POST   /admin/events/{event}/packages        create
//   GET    /admin/events/{event}/packages/{id}   detail
//   PUT    /admin/events/{event}/packages/{id}   update
//   DELETE /admin/events/{event}/packages/{id}   delete
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateEventPackageInput,
  EventPackage,
  NnakPagination,
} from "@/types/nnak";

interface PackagesResponse {
  success: boolean;
  data: EventPackage[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/packages`;

export const eventPackageService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<PackagesResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<EventPackage>(nnakApi.get(`${base(eventId)}/${id}`)),

  create: async (
    eventId: string,
    input: CreateEventPackageInput,
  ): Promise<EventPackage> =>
    unwrap<EventPackage>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateEventPackageInput>,
  ): Promise<EventPackage> =>
    unwrap<EventPackage>(nnakApi.put(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
