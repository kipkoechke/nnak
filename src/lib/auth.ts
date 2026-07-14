import type { NnakUser } from "@/types/nnak";
import { NNAK_TOKEN_KEY, NNAK_USER_COOKIE } from "./api";

const STORAGE_KEY = "nnak_user";
const TOKEN_EXPIRY_KEY = "nnak_token_expires_at";

const isSecure = () => {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
};

const setCookie = (name: string, value: string, days = 30) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  const secure = isSecure() ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax${secure}`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  const secure = isSecure() ? "; Secure" : "";
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${secure}`;
};

export const setNnakSession = (user: NnakUser, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(NNAK_TOKEN_KEY, token);
  setCookie(NNAK_USER_COOKIE, encodeURIComponent(JSON.stringify({
    id: user.id, email: user.email, role: user.role, name: user.name,
  })));
};

/** Persist just the refreshed token (and optional new expiry) without
 *  touching the cached user — used by the background refresh loop. */
export const updateNnakToken = (token: string, expiresAt?: string | number) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(NNAK_TOKEN_KEY, token);
  if (expiresAt !== undefined) setNnakTokenExpiry(expiresAt);
};

export const setNnakTokenExpiry = (expiresAt: string | number) => {
  if (typeof window === "undefined") return;
  // Accept an ISO string, an epoch-ms/seconds, or a seconds-from-now value.
  let iso: string;
  if (typeof expiresAt === "number") {
    // Small numbers are a lifetime in seconds; large ones an absolute epoch.
    const ms =
      expiresAt < 1e10
        ? Date.now() + expiresAt * 1000 // seconds-from-now
        : expiresAt; // epoch ms
    iso = new Date(ms).toISOString();
  } else {
    iso = expiresAt;
  }
  localStorage.setItem(TOKEN_EXPIRY_KEY, iso);
};

/** Milliseconds until the current token expires, or null if unknown. */
export const getNnakTokenTtl = (): number | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return null;
  return t - Date.now();
};

export const getNnakToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NNAK_TOKEN_KEY);
};

export const getNnakUser = (): NnakUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NnakUser) : null;
  } catch {
    return null;
  }
};

export const clearNnakSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NNAK_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  removeCookie(NNAK_USER_COOKIE);
};

// ---------------------------------------------------------------------------
// Legacy-named re-exports kept so older callers (Header, Sidebar, AppLayout,
// Providers, /api/logout route) keep working after the project converged onto
// the single NNAK auth scheme.
// ---------------------------------------------------------------------------
export const USER_COOKIE = NNAK_USER_COOKIE;
export const setAuthUser = (user: NnakUser, token?: string) =>
  setNnakSession(user, token ?? localStorage.getItem(NNAK_TOKEN_KEY) ?? "");
export const getAuthUser = getNnakUser;
export const clearAuthUser = clearNnakSession;
export const isAuthenticated = (): boolean => !!getNnakUser();
