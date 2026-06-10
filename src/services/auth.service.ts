/**
 * NNAK authentication — backed by /api/v1 (Laravel Sanctum + OTP).
 *
 * All endpoints return the standard `{ success, message?, data }`
 * envelope; this module unwraps `data` so the rest of the app sees
 * the inner payload only.
 *
 * Auth flow is two-step for both register and login:
 *   1. POST /register | /login  -> { pending_token, expires_in, otp? }
 *   2. POST /verify-otp { pending_token, otp } -> { user, token, ... }
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { getNnakUser } from "@/lib/auth";
import type {
  ApiEnvelope,
  NnakLoginResponse,
  NnakProfile,
  NnakUser,
  PendingOtpResponse,
} from "@/types/nnak";

export type NnakUserWithProfile = NnakUser & { profile?: NnakProfile | null };

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  license_number: string;
  identification_type: string;
  identification_number: string;
  date_of_birth: string;
  gender: string;
  nck_number?: string;
  professional_qualification?: string;
}

export const nnakAuth = {
  /** First-leg login. Returns a pending_token; complete with verifyOtp. */
  login: (body: { email: string; password: string }) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/login", body)),

  /** First-leg register. Returns a pending_token; complete with verifyOtp. */
  register: (body: RegisterPayload) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/register", body)),

  /** Second-leg: exchanges pending_token + otp for a Sanctum token. */
  verifyOtp: (body: { pending_token: string; otp: string }) =>
    unwrap<NnakLoginResponse>(nnakApi.post("/verify-otp", body)),

  forgotPassword: (body: { email: string }) =>
    unwrap<{ token?: string }>(nnakApi.post("/forgot-password", body)),

  resetPassword: (body: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) => unwrap<null>(nnakApi.post("/reset-password", body)),

  changePassword: (body: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => unwrap<null>(nnakApi.post("/change-password", body)),

  /** GET /profile -> { user: { ..., profile: {...} } }
   *  Demo sessions short-circuit to the locally seeded user so they don't
   *  401 against the real backend and trip the auth-expired interceptor. */
  me: async (): Promise<NnakUserWithProfile | null> => {
    if (isDemoSession()) {
      return getNnakUser() as NnakUserWithProfile | null;
    }
    return unwrap<{ user: NnakUserWithProfile }>(
      nnakApi.get("/profile"),
    ).then((d) => d.user);
  },

  logout: () => nnakApi.post("/logout").then(() => undefined),

  refreshToken: () =>
    unwrap<{ token: string; expires_at: string; expires_in: number }>(
      nnakApi.post("/refresh-token"),
    ),
};
