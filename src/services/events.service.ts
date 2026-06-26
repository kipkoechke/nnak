// Events service — real backend with demo fallback.
//
// Endpoints
//   GET    /events                          list (paginated)
//   POST   /events                          create
//   GET    /events/{id}                     detail
//   PATCH  /events/{id}                     update
//   DELETE /events/{id}                     delete
//   POST   /events/{id}/publish             publish
//   POST   /events/{id}/register            register member
//   POST   /event-registrations/{token}/checkin
//   POST   /event-registrations/{id}/certificate
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type { ApiEnvelope, CreateEventInput, EventRegistration, NnakEvent, NnakPagination } from "@/types/nnak";

interface EventsResponse {
  success: boolean;
  data: NnakEvent[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const eventsService = {
  list: async (params?: { page?: number; per_page?: number; status?: string }) => {
    if (isDemoSession()) {
      const mock = mockStore.listEvents(params);
      return { ...mock, pagination: mock.meta };
    }
    const r = await nnakApi.get<EventsResponse>("/admin/events", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) => {
    if (isDemoSession()) return mockStore.getEvent(id);
    return unwrap<NnakEvent>(nnakApi.get(`/admin/events/${id}`));
  },

  create: async (input: CreateEventInput): Promise<NnakEvent> => {
    if (isDemoSession()) return mockStore.upsertEvent(input as Partial<NnakEvent>);
    return unwrap<NnakEvent>(nnakApi.post("/admin/events", input));
  },

  update: async (id: string, input: Partial<CreateEventInput>): Promise<NnakEvent> => {
    if (isDemoSession()) return mockStore.upsertEvent({ ...input, id } as Partial<NnakEvent>);
    return unwrap<NnakEvent>(nnakApi.patch(`/admin/events/${id}`, input));
  },

  remove: async (id: string) => {
    if (isDemoSession()) { mockStore.deleteEvent(id); return; }
    await nnakApi.delete(`/admin/events/${id}`);
  },

  registrants: async (id: string) => {
    if (isDemoSession()) return mockStore.listEventRegistrants(id);
    return unwrap<EventRegistration[]>(nnakApi.get(`/admin/events/${id}/registrants`));
  },

  register: async (eventId: string, userId: string, fee: number) => {
    if (isDemoSession()) return mockStore.registerForEvent(eventId, userId, fee);
    return unwrap<EventRegistration>(
      nnakApi.post(`/admin/events/${eventId}/register`, { user_id: userId, fee }),
    );
  },

  checkIn: async (qrToken: string) => {
    if (isDemoSession()) return mockStore.checkInRegistration(qrToken);
    return unwrap<EventRegistration>(
      nnakApi.post(`/admin/event-registrations/${qrToken}/checkin`),
    );
  },

  issueCertificate: async (regId: string) => {
    if (isDemoSession()) return mockStore.issueCertificate(regId);
    return unwrap<EventRegistration>(
      nnakApi.post(`/admin/event-registrations/${regId}/certificate`),
    );
  },

  myRegistrations: async (userId: string) => {
    if (isDemoSession()) return mockStore.listMyRegistrations(userId);
    return unwrap<EventRegistration[]>(
      nnakApi.get("/member/event-registrations", { params: { user_id: userId } }),
    );
  },
};
