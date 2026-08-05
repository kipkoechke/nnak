// GET /admin/dashboard?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { AdminDashboardData, ApiEnvelope } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  /** Advertised in the response's `supported_params`; narrows to one branch. */
  branch_id?: string;
}

const loadFrom = async (
  path: string,
  params?: DateRangeParams,
): Promise<AdminDashboardData | null> => {
  if (isDemoSession()) return null;
  try {
    return await unwrap<AdminDashboardData>(nnakApi.get(path, { params }));
  } catch {
    return null;
  }
};

export const adminDashboardService = {
  load: (params?: DateRangeParams) => loadFrom("/admin/dashboard", params),

  /**
   * GET /executive/dashboard — the same payload, for executive members who
   * hold none of the admin routes. `start_date` / `end_date` are required.
   */
  loadExecutive: (params?: DateRangeParams) =>
    loadFrom("/executive/dashboard", params),
};
