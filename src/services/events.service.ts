// Admin event management:
//   GET    /admin/events              list (paginated)
//   POST   /admin/events              create
//   GET    /admin/events/{event}      detail
//   PUT    /admin/events/{event}      update (all fields optional, + is_approved)
//   DELETE /admin/events/{event}      delete (204)
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateEventInput,
  NnakEvent,
  NnakPagination,
  UpdateEventInput,
} from "@/types/nnak";

interface EventsResponse {
  success: boolean;
  data: NnakEvent[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const eventsService = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    const r = await nnakApi.get<EventsResponse>("/admin/events", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<NnakEvent>(nnakApi.get(`/admin/events/${id}`)),

  create: async (input: CreateEventInput): Promise<NnakEvent> =>
    unwrap<NnakEvent>(nnakApi.post("/admin/events", input)),

  update: async (id: string, input: UpdateEventInput): Promise<NnakEvent> =>
    unwrap<NnakEvent>(nnakApi.put(`/admin/events/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/admin/events/${id}`);
  },
};
