/**
 * Routes reachable without a session.
 *
 * Shared by the middleware (which decides whether to bounce a request to the
 * login screen) and the client-side 401 handler (which must not redirect a
 * guest away from a page that never needed a session in the first place).
 * Keeping one list stops the two drifting apart.
 */
export const PUBLIC_ROUTES = [
  "/nnak/login",
  "/nnak/register",
  "/nnak/verify-otp",
  "/nnak/forgot-password",
  "/nnak/reset-password",
  "/unauthorized",
  "/nnak/register/student",
  "/nnak/onboarding",
  "/nnak/privacy",
  /** Public event listing and detail — browsing and booking need no account. */
  "/events",
] as const;

/** True when `pathname` is one of the public routes, or nested under one. */
export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
