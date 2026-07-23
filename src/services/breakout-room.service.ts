// Breakout Room endpoints (nested under event/agenda):
//   GET  /events/{event}/agendas/{agenda}/breakout-rooms         list
//   POST /events/{event}/agendas/{agenda}/breakout-rooms         create
//   GET  /events/{event}/agendas/{agenda}/breakout-rooms/{id}    detail
//   PUT   /events/{event}/agendas/{agenda}/breakout-rooms/{id}   update
//   DELETE /events/{event}/agendas/{agenda}/breakout-rooms/{id}  delete
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BreakoutRoom,
  CreateBreakoutRoomInput,
  NnakPagination,
} from "@/types/nnak";

interface BreakoutRoomsResponse {
  success: boolean;
  data: BreakoutRoom[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string, agendaId: string) =>
  `/admin/events/${eventId}/agendas/${agendaId}/breakout-rooms`;

export const breakoutRoomService = {
  list: async (
    eventId: string,
    agendaId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<BreakoutRoomsResponse>(
      base(eventId, agendaId),
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, agendaId: string, id: string) =>
    unwrap<BreakoutRoom>(nnakApi.get(`${base(eventId, agendaId)}/${id}`)),

  create: async (
    eventId: string,
    agendaId: string,
    input: CreateBreakoutRoomInput,
  ): Promise<BreakoutRoom> =>
    unwrap<BreakoutRoom>(nnakApi.post(base(eventId, agendaId), input)),

  update: async (
    eventId: string,
    agendaId: string,
    id: string,
    input: Partial<CreateBreakoutRoomInput>,
  ): Promise<BreakoutRoom> =>
    unwrap<BreakoutRoom>(
      nnakApi.put(`${base(eventId, agendaId)}/${id}`, input),
    ),

  remove: async (eventId: string, agendaId: string, id: string) => {
    await nnakApi.delete(`${base(eventId, agendaId)}/${id}`);
  },
};
