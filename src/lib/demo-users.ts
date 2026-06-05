/**
 * Hardcoded demo users — one per NNAK role — for use until the real
 * backend auth is live. The login page renders a quick-pick panel that
 * calls `signInAsDemoUser(role)` to populate the session synchronously
 * (no network call).
 *
 * Replace usage with the real `useNnakLogin` mutation once the API is
 * ready. Nothing in the rest of the app needs to change — these users
 * are persisted through the same `setNnakSession` path as a normal
 * login response.
 */
import type { NnakUser, NnakRole } from "@/types/nnak";
import { NNAK_ROLES } from "@/lib/rbac";
import { setNnakSession } from "@/lib/auth";
import { mockStore } from "@/lib/mock-store";
import { DEMO_TOKEN } from "@/lib/demo-token";

export { DEMO_TOKEN };

type DemoSeed = Pick<NnakUser, "id" | "name" | "email" | "role"> & {
  description: string;
  /** For member/student personas: drives the seeded subscription state. */
  state?: "active" | "overdue";
};

export const DEMO_USERS: readonly DemoSeed[] = [
  {
    id: "demo-super-admin",
    name: "Sarah Otieno",
    email: "sysadmin@nnak.demo",
    role: "super_admin",
    description: "Full system access — RBAC, audit logs, ILM",
  },
  {
    id: "demo-admin",
    name: "James Mwangi",
    email: "secretariat@nnak.demo",
    role: "admin",
    description: "HQ Secretariat — members, by-product, events, reports",
  },
  {
    id: "demo-finance",
    name: "Lucy Wambui",
    email: "finance@nnak.demo",
    role: "finance",
    description: "Finance Officer — payments, reconciliation, financials",
  },
  {
    id: "demo-events",
    name: "Peter Kamau",
    email: "events@nnak.demo",
    role: "events",
    description: "Events Coordinator — create events, run check-in",
  },
  {
    id: "demo-branch",
    name: "Grace Achieng",
    email: "nakuru.branch@nnak.demo",
    role: "branch",
    description: "Branch Chair/Secretariat — branch member management",
  },
  {
    id: "demo-branch-manager",
    name: "Daniel Kiptoo",
    email: "branchmgr@nnak.demo",
    role: "branch_manager",
    description: "Branch Manager — branch reports & member oversight",
  },
  {
    id: "demo-executive",
    name: "Dr. Mary Njeri",
    email: "exec@nnak.demo",
    role: "executive",
    description: "NNAK Executive — read-only executive dashboards",
  },
  {
    id: "demo-member",
    name: "John Otieno",
    email: "member@nnak.demo",
    role: "member",
    state: "overdue",
    description: "Registered Nurse · Individual (M-Pesa) — OVERDUE (renewal demo)",
  },
  {
    id: "demo-member-branch",
    name: "Mary Wanjiku",
    email: "mary.wanjiku@nnak.demo",
    role: "member",
    state: "active",
    description: "Registered Nurse · Counties branch (check-off) — active",
  },
  {
    id: "demo-student",
    name: "Faith Naliaka",
    email: "student@nnak.demo",
    role: "student",
    description: "Student Nurse — event registration only",
  },
];

export const demoUserLabel = (role: NnakRole): string =>
  NNAK_ROLES[role] ?? role;

/**
 * Sign in as a demo user. Mirrors the side effects of a real
 * `useNnakLogin().mutateAsync()` success: persists user + token to
 * localStorage and sets the nnak_user cookie the middleware reads.
 *
 * Accepts either a persona id (preferred — disambiguates personas that
 * share a role) or, for back-compat, a role.
 */
export const signInAsDemoUser = (key: NnakRole | string): NnakUser | null => {
  // Try id first, then role, so the dropdown can pass either.
  const seed =
    DEMO_USERS.find((u) => u.id === key) ||
    DEMO_USERS.find((u) => u.role === (key as NnakRole));
  if (!seed) return null;

  if (seed.role === "member" || seed.role === "student") {
    const categoryCode: "individual" | "student" | "county" =
      seed.role === "student"
        ? "student"
        : seed.id === "demo-member-branch"
          ? "county"
          : "individual";
    const seeded = mockStore.ensureDemoMember({
      id: seed.id,
      name: seed.name,
      email: seed.email,
      role: seed.role,
      categoryCode,
      state: seed.state ?? "active",
    });
    setNnakSession(seeded, DEMO_TOKEN);
    return seeded;
  }

  const user: NnakUser = {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    email_verified_at: new Date().toISOString(),
  };
  setNnakSession(user, DEMO_TOKEN);
  return user;
};
