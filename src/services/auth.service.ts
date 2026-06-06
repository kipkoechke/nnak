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
import type {
  ApiEnvelope,
  NnakLoginResponse,
  NnakUser,
  PendingOtpResponse,
} from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  license_number?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
  date_of_birth?: string | null;
  gender?: string;
  nck_number?: string | null;
  professional_qualification?: string | null;
  member_category_id?: string | null;
  branch_id?: string | null;
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

  /** GET /profile -> { user: { ..., profile: {...} } } */
  me: () =>
    unwrap<{ user: NnakUser & { profile?: unknown } }>(
      nnakApi.get("/profile"),
    ).then((d) => d.user),

  logout: () => nnakApi.post("/logout").then(() => undefined),

  refreshToken: () =>
    unwrap<{ token: string; expires_at: string; expires_in: number }>(
      nnakApi.post("/refresh-token"),
    ),
};
