/**
 * Axios instance targeting the NNAK Laravel backend (/api/v1).
 * Uses Bearer token (Sanctum) — stored in localStorage and rotated on refresh.
 */
import axios, { AxiosError } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_NNAK_API_URL ||
  "https://api.nnak.or.ke/api/v1";

export const NNAK_TOKEN_KEY = "nnak_token";
export const NNAK_USER_COOKIE = "nnak_user";

export const nnakApi = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

nnakApi.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem(NNAK_TOKEN_KEY);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// A 401 on the pre-auth endpoints is an expected credential/OTP failure, not
// a session expiry — it must not clear the token or fire the expired flow
// (which would log a user out mid sign-in).
const AUTH_FLOW_PATHS = [
  "/login",
  "/register",
  "/verify-otp",
  "/resend-otp",
  "/forgot-password",
  "/reset-password",
  "/onboarding/",
];

nnakApi.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const url = err.config?.url || "";
    const isAuthFlow = AUTH_FLOW_PATHS.some((p) => url.includes(p));
    if (
      err.response?.status === 401 &&
      !isAuthFlow &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem(NNAK_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("nnak:auth-expired"));
    }
    return Promise.reject(err);
  },
);
