/**
 * Admin accounts service — super-admin only.
 *
 * Endpoints
 *   GET  /admin/admins            list admin users
 *   POST /admin/admins            create an admin { name, email }
 *
 * The backend provisions the account (and emails an invite / credentials),
 * so creation only needs a name and email.
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { ApiEnvelope, NnakPagination, NnakUser } from "@/types/nnak";

interface AdminsResponse {
  success: boolean;
  data: NnakUser[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface CreateAdminInput {
  name: string;
  email: string;
}

export const adminsService = {
  list: async (): Promise<NnakUser[]> => {
    if (isDemoSession()) return [];
    const r = await nnakApi.get<AdminsResponse>("/admin/admins");
    return r.data?.data ?? [];
  },

  create: async (body: CreateAdminInput): Promise<NnakUser> =>
    unwrap<NnakUser>(nnakApi.post("/admin/admins", body)),
};
