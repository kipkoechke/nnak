// GET /member/dashboard — server-side computed dashboard for the
// authenticated member (account number, current subscription + invoice).
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { ApiEnvelope, MemberDashboardData } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const memberDashboardService = {
  load: async (): Promise<MemberDashboardData | null> => {
    if (isDemoSession()) return null; // demo uses the legacy mockStore view
    try {
      return await unwrap<MemberDashboardData>(nnakApi.get("/member/dashboard"));
    } catch {
      return null;
    }
  },
};
