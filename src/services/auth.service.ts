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
  StudentRegisterPayload,
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
  identification_type: string;
  identification_number: string;
  date_of_birth: string;
  gender: string;
  nck_number: string;
  professional_qualification: string;
  professional_cadre: string;
  designation?: string;
  place_of_work?: string;
  county?: string;
  employer_type?: string;
  chapter?: string;
  branch_id?: string;
}

/** Fields a member can edit on their own profile. All optional so the form
 *  can send only what changed. */
export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  county?: string;
  designation?: string;
  place_of_work?: string;
  employer_type?: string;
  chapter?: string;
}

/** Result of GET provisional account lookup. Fields are best-effort — the
 *  backend returns whatever it can safely reveal to confirm a match. */
export interface OnboardingLookupResult {
  found: boolean;
  identification_number?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  membership_number?: string | null;
  nck_number?: string | null;
  claimed?: boolean;
  [key: string]: unknown;
}

export interface OnboardingClaimPayload {
  identification_number: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  chapter: string;
  professional_qualification: string;
  professional_cadre: string;
  gender: string;
  date_of_birth: string;
  designation: string;
  institution: string;
  nck_number: string;
}

export const nnakAuth = {
  /** First-leg login. Returns a pending_token; complete with verifyOtp. */
  login: (body: { email: string; password: string }) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/login", body)),

  /** First-leg register. Returns a pending_token; complete with verifyOtp. */
  register: (body: RegisterPayload) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/register", body)),

  /** Student first-leg register — POST /register/student */
  registerStudent: (body: StudentRegisterPayload) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/register/student", body)),

  /** Second-leg: exchanges pending_token + otp for a Sanctum token. */
  verifyOtp: (body: { pending_token: string; otp: string }) =>
    unwrap<NnakLoginResponse>(nnakApi.post("/verify-otp", body)),

  /** Request a fresh OTP for an existing pending_token. */
  resendOtp: (body: { pending_token: string }) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/resend-otp", body)),

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

  /** Update the signed-in user's own profile. PUT /profile mirrors GET /profile
   *  and returns the refreshed user (with nested profile). */
  updateProfile: (body: UpdateProfilePayload) =>
    unwrap<{ user: NnakUserWithProfile }>(nnakApi.put("/profile", body)).then(
      (d) => d.user,
    ),

  /** GET /profile -> { user: { ..., profile: {...} } }
   *  Demo sessions short-circuit to the locally seeded user so they don't
   *  401 against the real backend and trip the auth-expired interceptor. */
  me: async (): Promise<NnakUserWithProfile | null> => {
    if (isDemoSession()) {
      return getNnakUser() as NnakUserWithProfile | null;
    }
    return unwrap<{ user: NnakUserWithProfile }>(nnakApi.get("/profile")).then(
      (d) => d.user,
    );
  },

  // ── Provisional account onboarding (migration claim flow) ──────────
  /** Look up an imported/provisional account by ID number. */
  onboardingLookup: (body: { identification_number: string }) =>
    unwrap<OnboardingLookupResult>(
      nnakApi.post("/onboarding/lookup", body),
    ),

  /** Submit full details for a provisional account and request an OTP. */
  onboardingClaim: (body: OnboardingClaimPayload) =>
    unwrap<PendingOtpResponse>(nnakApi.post("/onboarding/claim", body)),

  /** Verify the OTP and activate the claimed account (issues a token). */
  onboardingVerifyClaim: (body: { pending_token: string; otp: string }) =>
    unwrap<NnakLoginResponse>(
      nnakApi.post("/onboarding/verify-claim", body),
    ),

  logout: () => nnakApi.post("/logout").then(() => undefined),

  refreshToken: () =>
    unwrap<{ token: string; expires_at: string; expires_in: number }>(
      nnakApi.post("/refresh-token"),
    ),
};
