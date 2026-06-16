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
  /** Create / edit branches — HQ only. Branch managers cannot. */
  manageBranches: (u?: NnakUser | null) => has(u, ["super_admin", "admin"]),

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
  /** Standalone Reports page — excludes branch_manager whose own
   *  dashboard is the only reporting surface they need. */
  viewReports: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin", "finance", "executive"]),

  // ILM
  manageILM: (u?: NnakUser | null) => has(u, ["super_admin", "admin"]),
  viewAuditLog: (u?: NnakUser | null) => has(u, ["super_admin"]),
  approveDataExport: (u?: NnakUser | null) =>
    has(u, ["super_admin", "admin"]),

  // System
  manageRoles: (u?: NnakUser | null) => has(u, ["super_admin"]),

  // Member self-service portal (FR-MP-002, 004, 005, 006, 009, 013, FR-EM-005)
  viewMyMembership: (u?: NnakUser | null) =>
    has(u, ["member", "student", "branch_manager"]),
  viewMyEvents: (u?: NnakUser | null) =>
    has(u, ["member", "student", "branch_manager"]),
  viewMyPayments: (u?: NnakUser | null) =>
    has(u, ["member", "branch_manager"]),
  payMySubscription: (u?: NnakUser | null) =>
    has(u, ["member", "branch_manager"]),
  viewMyWorkstations: (u?: NnakUser | null) =>
    has(u, ["member", "student", "branch_manager"]),
};

export const isStaff = (u?: NnakUser | null) =>
  !!u &&
  ["super_admin", "admin", "finance", "events", "branch", "branch_manager", "executive"].includes(
    u.role,
  );

export const isMemberRole = (u?: NnakUser | null) =>
  !!u && (u.role === "member" || u.role === "student");
