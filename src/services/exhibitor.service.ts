// Exhibitor endpoints:
//   GET  /exhibitors?event_id=     list
//   POST /exhibitors                create
//   GET  /exhibitors/{id}           detail
//   PATCH /exhibitors/{id}          update
//   DELETE /exhibitors/{id}         delete
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

export const exhibitorService = {
  list: async (params?: { event_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<ExhibitorsResponse>("/exhibitors", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<Exhibitor>(nnakApi.get(`/exhibitors/${id}`)),

  create: async (input: CreateExhibitorInput): Promise<Exhibitor> =>
    unwrap<Exhibitor>(nnakApi.post("/exhibitors", input)),

  update: async (id: string, input: Partial<CreateExhibitorInput>): Promise<Exhibitor> =>
    unwrap<Exhibitor>(nnakApi.patch(`/exhibitors/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/exhibitors/${id}`);
  },
};
