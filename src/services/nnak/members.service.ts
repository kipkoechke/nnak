/**
 * Members service.
 * Real backend (/api/v1/users + /api/v1/user-profiles) supports CRUD + listing.
 * Approval/status/category-upgrade flows are MOCK until the backend exposes them.
 */
import { mockStore } from "@/lib/nnak/mock-store";
import type { NnakProfile, MemberStatus } from "@/types/nnak";

export const membersService = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    category_id?: string;
    branch_id?: string;
  }) => mockStore.listMembers(params),
  getById: async (id: string) => mockStore.getMember(id),
  create: async (input: {
    name: string;
    email: string;
    role?: "member" | "student";
    profile: Partial<NnakProfile>;
  }) => mockStore.createMember(input),
  update: async (id: string, patch: { name?: string; email?: string; profile?: Partial<NnakProfile> }) =>
    mockStore.updateMember(id, patch),
  setStatus: async (id: string, status: MemberStatus, reason?: string) =>
    mockStore.setMemberStatus(id, status, reason),
  approve: async (id: string) => mockStore.setMemberStatus(id, "active", "approved by admin"),
  suspend: async (id: string, reason?: string) =>
    mockStore.setMemberStatus(id, "suspended", reason),
};
