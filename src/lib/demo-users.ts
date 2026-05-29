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

export const DEMO_TOKEN = "demo-token";

type DemoSeed = Pick<NnakUser, "id" | "name" | "email" | "role"> & {
  description: string;
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
    description: "Registered Nurse · Individual (M-Pesa) — active",
  },
  {
    id: "demo-member-branch",
    name: "Mary Wanjiku",
    email: "mary.wanjiku@nnak.demo",
    role: "member",
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
 */
export const signInAsDemoUser = (role: NnakRole): NnakUser | null => {
  const seed = DEMO_USERS.find((u) => u.role === role);
  if (!seed) return null;

  // For member / student personas, materialise a real member record in the
  // mock store so the portal pages (membership, events, payments) have
  // data to render. Seeded user object includes the profile.
  if (seed.role === "member" || seed.role === "student") {
    // Pick the category that best suits the persona so demos cover both
    // the individual (M-Pesa) and branch (check-off) flows.
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
