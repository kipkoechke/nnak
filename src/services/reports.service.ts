// MOCK — backend endpoint TBD. Suggested contract:
//   GET /reports/dashboard
//   GET /reports/financial?period=monthly&from=&to=
//   GET /reports/events
//   POST /reports/export  { type, format, scope }
import { mockStore } from "@/lib/mock-store";

export const reportsService = {
  kpis: async () => mockStore.kpis(),
};
