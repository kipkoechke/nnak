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

nnakApi.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(NNAK_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("nnak:auth-expired"));
    }
    return Promise.reject(err);
  },
);
