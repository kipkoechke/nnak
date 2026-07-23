// Agenda-Speaker endpoints (nested under event/agenda), all under /admin:
//   GET    .../agendas/{agenda}/agenda-speakers        list
//   POST   .../agendas/{agenda}/agenda-speakers        link a speaker
//   GET    .../agendas/{agenda}/agenda-speakers/{id}   detail
//   PUT    .../agendas/{agenda}/agenda-speakers/{id}   update
//   DELETE .../agendas/{agenda}/agenda-speakers/{id}   unlink
import { nnakApi } from "@/lib/api";
import type {
  AgendaSpeaker,
  ApiEnvelope,
  CreateAgendaSpeakerInput,
  NnakPagination,
} from "@/types/nnak";

interface AgendaSpeakersResponse {
  success: boolean;
  data: AgendaSpeaker[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string, agendaId: string) =>
  `/admin/events/${eventId}/agendas/${agendaId}/agenda-speakers`;

export const agendaSpeakerService = {
  list: async (
    eventId: string,
    agendaId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<AgendaSpeakersResponse>(
      base(eventId, agendaId),
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, agendaId: string, id: string) =>
    unwrap<AgendaSpeaker>(nnakApi.get(`${base(eventId, agendaId)}/${id}`)),

  create: async (
    eventId: string,
    agendaId: string,
    input: CreateAgendaSpeakerInput,
  ): Promise<AgendaSpeaker> =>
    unwrap<AgendaSpeaker>(nnakApi.post(base(eventId, agendaId), input)),

  update: async (
    eventId: string,
    agendaId: string,
    id: string,
    input: Partial<CreateAgendaSpeakerInput>,
  ): Promise<AgendaSpeaker> =>
    unwrap<AgendaSpeaker>(
      nnakApi.put(`${base(eventId, agendaId)}/${id}`, input),
    ),

  remove: async (eventId: string, agendaId: string, id: string) => {
    await nnakApi.delete(`${base(eventId, agendaId)}/${id}`);
  },
};
