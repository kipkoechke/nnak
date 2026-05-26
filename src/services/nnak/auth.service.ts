/**
 * NNAK authentication — backed by /api/v1 (Laravel Sanctum + OTP).
 */
import { nnakApi } from "@/lib/nnak/api";
import type { NnakLoginResponse, NnakUser } from "@/types/nnak";

interface OtpVerifyResponse {
  message: string;
  user: NnakUser;
}

export const nnakAuth = {
  login: (body: { email: string; password: string }) =>
    nnakApi.post<NnakLoginResponse>("/login", body).then((r) => r.data),

  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    license_number?: string | null;
    identification_type?: string | null;
    identification_number?: string | null;
    date_of_birth?: string | null;
    gender?: "male" | "female" | "other";
    member_category_id?: string | null;
    branch_id?: string | null;
  }) => nnakApi.post<NnakLoginResponse>("/register", body).then((r) => r.data),

  verifyOtp: (body: { email: string; otp: string }) =>
    nnakApi.post<OtpVerifyResponse>("/verify-otp", body).then((r) => r.data),

  forgotPassword: (body: { email: string }) =>
    nnakApi
      .post<{ message: string; token: string }>("/forgot-password", body)
      .then((r) => r.data),

  resetPassword: (body: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) =>
    nnakApi
      .post<{ message: string }>("/reset-password", body)
      .then((r) => r.data),

  changePassword: (body: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) =>
    nnakApi
      .post<{ message: string }>("/change-password", body)
      .then((r) => r.data),

  me: () => nnakApi.get<{ user: NnakUser }>("/profile").then((r) => r.data.user),

  logout: () => nnakApi.post<{ message: string }>("/logout").then((r) => r.data),

  refreshToken: () =>
    nnakApi
      .post<{ token: string; expires_at: string; expires_in: number }>("/refresh-token")
      .then((r) => r.data),
};
