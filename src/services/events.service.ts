// MOCK — backend endpoint TBD. Suggested contract:
//   GET    /events             list
//   POST   /events             create
//   PATCH  /events/{id}        update
//   DELETE /events/{id}        delete
//   POST   /events/{id}/publish
//   POST   /events/{id}/register
//   POST   /event-registrations/{token}/checkin
//   POST   /event-registrations/{id}/certificate
import { mockStore } from "@/lib/mock-store";
import type { NnakEvent } from "@/types/nnak";

export const eventsService = {
  list: async (params?: { page?: number; per_page?: number; status?: string }) =>
    mockStore.listEvents(params),
  getById: async (id: string) => mockStore.getEvent(id),
  upsert: async (input: Partial<NnakEvent> & { id?: string }) =>
    mockStore.upsertEvent(input),
  remove: async (id: string) => mockStore.deleteEvent(id),
  registrants: async (id: string) => mockStore.listEventRegistrants(id),
  register: async (eventId: string, userId: string, fee: number) =>
    mockStore.registerForEvent(eventId, userId, fee),
  checkIn: async (qrToken: string) => mockStore.checkInRegistration(qrToken),
  issueCertificate: async (regId: string) => mockStore.issueCertificate(regId),
  myRegistrations: async (userId: string) => mockStore.listMyRegistrations(userId),
};
