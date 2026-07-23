// Breakout Speaker endpoints (nested under event/agenda/breakout-room):
//   GET    .../breakout-rooms/{room}/breakout-speakers        list
//   POST   .../breakout-rooms/{room}/breakout-speakers        link a speaker
//   GET    .../breakout-rooms/{room}/breakout-speakers/{id}   detail
//   PUT    .../breakout-rooms/{room}/breakout-speakers/{id}   update
//   DELETE .../breakout-rooms/{room}/breakout-speakers/{id}   unlink
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BreakoutSpeaker,
  CreateBreakoutSpeakerInput,
  NnakPagination,
} from "@/types/nnak";

interface BreakoutSpeakersResponse {
  success: boolean;
  data: BreakoutSpeaker[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string, agendaId: string, breakoutRoomId: string) =>
  `/admin/events/${eventId}/agendas/${agendaId}/breakout-rooms/${breakoutRoomId}/breakout-speakers`;

export const breakoutSpeakerService = {
  list: async (
    eventId: string,
    agendaId: string,
    breakoutRoomId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<BreakoutSpeakersResponse>(
      base(eventId, agendaId, breakoutRoomId),
      { params },
    );
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (
    eventId: string,
    agendaId: string,
    breakoutRoomId: string,
    id: string,
  ) =>
    unwrap<BreakoutSpeaker>(
      nnakApi.get(`${base(eventId, agendaId, breakoutRoomId)}/${id}`),
    ),

  create: async (
    eventId: string,
    agendaId: string,
    breakoutRoomId: string,
    input: CreateBreakoutSpeakerInput,
  ): Promise<BreakoutSpeaker> =>
    unwrap<BreakoutSpeaker>(
      nnakApi.post(base(eventId, agendaId, breakoutRoomId), input),
    ),

  update: async (
    eventId: string,
    agendaId: string,
    breakoutRoomId: string,
    id: string,
    input: Partial<CreateBreakoutSpeakerInput>,
  ): Promise<BreakoutSpeaker> =>
    unwrap<BreakoutSpeaker>(
      nnakApi.put(`${base(eventId, agendaId, breakoutRoomId)}/${id}`, input),
    ),

  remove: async (
    eventId: string,
    agendaId: string,
    breakoutRoomId: string,
    id: string,
  ) => {
    await nnakApi.delete(`${base(eventId, agendaId, breakoutRoomId)}/${id}`);
  },
};
