import type { NnakRole, NnakUser } from "@/types/nnak";

/**
 * NNAK role helpers — UX guards only. Server enforces real authorisation.
 * Personas per SRS §2.2 and ILM matrix §6.1.
 */

export const NNAK_ROLES: Record<NnakRole, string> = {
  super_admin: "System Administrator",
  admin: "HQ Secretariat",
  finance: "Finance Officer",
  events: "Events Coordinator",
  branch_manager: "Branch Manager",
  branch: "Branch Chair / Secretariat",
  executive: "NNAK Executive",
  member: "Registered Member",
  student: "Student Member",
};

const has = (u: NnakUser | null | undefined, roles: NnakRole[]) =>
  !!u && roles.includes(u.role);

export const nnakCan = {
  // Member management
  approveMembers: (u?: NnakUser | null) => has(u, ["super_admin", "admin"]),
  manageMembers: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "branch", "branch_manager"]),
  upgradeCategory: (u?: NnakUser | null) => has(u, ["super_admin", "admin"]),

  // Events
  manageEvents: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "events"]),
  checkInAttendees: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "events"]),

  // Payments / Finance
  viewFinancials: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "finance", "executive"]),
  reconcileByProduct: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "finance"]),

  // Reports
  viewDashboard: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "finance", "executive", "branch", "branch_manager", "events"]),
  viewExecutiveKpis: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "executive", "finance"]),
  viewBranchOnly: (u?: NnakUser | null) =>
    has(u, ["branch", "branch_manager"]),
  exportData: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "finance"]),

  // ILM
  manageILM: (u?: NnakUser | null) => has(u, ["super_admin", "admin"]),
  viewAuditLog: (u?: NnakUser | null) => has(u, ["super_admin"]),
  approveDataExport: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin"]),

  // System
  manageRoles: (u?: NnakUser | null) => has(u, ["super_admin"]),
};

export const isStaff = (u?: NnakUser | null) =>
  !!u &&
  ["super_admin", "admin", "finance", "events", "branch", "branch_manager", "executive"].includes(
    u.role,
  );

export const isMemberRole = (u?: NnakUser | null) =>
  !!u && (u.role === "member" || u.role === "student");
