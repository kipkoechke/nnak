// MOCK — backend endpoint TBD. Suggested contract:
//   GET  /audit-log
//   GET/POST /data-export-requests
//   POST /data-export-requests/{id}/approve|reject
//   GET/POST /erasure-requests
//   POST /erasure-requests/{id}/complete
import { mockStore } from "@/lib/mock-store";

export const ilmService = {
  audit: async (p?: { page?: number; per_page?: number }) => mockStore.listAudit(p),

  exports: {
    list: async () => mockStore.listExports(),
    request: async (input: { requested_by: string; scope: string; reason: string; destination: string }) =>
      mockStore.requestExport(input),
    decide: async (id: string, approver: string, approve: boolean) =>
      mockStore.decideExport(id, approver, approve),
  },

  erasures: {
    list: async () => mockStore.listErasures(),
    request: async (input: { user_id: string; user_email?: string; reason?: string }) =>
      mockStore.requestErasure(input),
    complete: async (id: string) => mockStore.completeErasure(id),
  },
};
