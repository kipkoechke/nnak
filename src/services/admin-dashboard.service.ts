// GET /admin/dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { AdminDashboardData, ApiEnvelope } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

export const adminDashboardService = {
  load: async (params?: DateRangeParams): Promise<AdminDashboardData | null> => {
    if (isDemoSession()) return null;
    try {
      return await unwrap<AdminDashboardData>(
        nnakApi.get("/admin/dashboard", { params }),
      );
    } catch {
      return null;
    }
  },
};
