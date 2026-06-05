// Hardcoded demo token marker. Services check this and short-circuit to
// the mock store instead of hitting the real API (which would 401 for
// the fake token and bounce the demo session out via the auth-expired
// interceptor).
//
// Kept in its own module so services can import it without pulling in
// the heavier demo-users.ts (which depends on mockStore).
import { NNAK_TOKEN_KEY } from "@/lib/api";

export const DEMO_TOKEN = "demo-token";

export const isDemoSession = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NNAK_TOKEN_KEY) === DEMO_TOKEN;
};
