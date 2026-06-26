// Agenda endpoints (nested under event):
//   GET  /events/{event}/agendas           list (paginated)
//   POST /events/{event}/agendas           create
//   GET  /events/{event}/agendas/{id}      detail
//   PATCH /events/{event}/agendas/{id}     update
//   DELETE /events/{event}/agendas/{id}    delete
import { nnakApi } from "@/lib/api";
import type {
  Agenda,
  ApiEnvelope,
  CreateAgendaInput,
  NnakPagination,
} from "@/types/nnak";

interface AgendasResponse {
  success: boolean;
  data: Agenda[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/agendas`;

export const agendaService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<AgendasResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<Agenda>(nnakApi.get(`${base(eventId)}/${id}`)),

  create: async (eventId: string, input: CreateAgendaInput): Promise<Agenda> =>
    unwrap<Agenda>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateAgendaInput>,
  ): Promise<Agenda> =>
    unwrap<Agenda>(nnakApi.patch(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
