// Agenda endpoints:
//   GET  /agendas?event_id=      list (paginated)
//   POST /agendas                 create
//   GET  /agendas/{id}            detail
//   PATCH /agendas/{id}           update
//   DELETE /agendas/{id}          delete
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

export const agendaService = {
  list: async (params?: { event_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<AgendasResponse>("/agendas", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<Agenda>(nnakApi.get(`/agendas/${id}`)),

  create: async (input: CreateAgendaInput): Promise<Agenda> =>
    unwrap<Agenda>(nnakApi.post("/agendas", input)),

  update: async (id: string, input: Partial<CreateAgendaInput>): Promise<Agenda> =>
    unwrap<Agenda>(nnakApi.patch(`/agendas/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/agendas/${id}`);
  },
};
