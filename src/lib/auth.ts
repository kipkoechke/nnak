// Lightweight client-side auth state.
//
// Authentication tokens themselves are HTTP-only cookies set & rotated by the
// backend (`access_token`, `refresh_token`) — the frontend never reads them.
//
// We mirror the authenticated user (role, id, email) into a non-HTTP-only
// cookie + localStorage purely for:
//   1. Middleware-side route gating (cookie is readable in `middleware.ts`)
//   2. Synchronous role-based UI rendering before `useMe()` resolves

import type { AuthUser } from "@/types/auth";

export const USER_COOKIE = "ehl_user";
const STORAGE_KEY = "ehl_user";
const COOKIE_DAYS = 30;

const setCookie = (name: string, value: string, days?: number) => {
  if (typeof document === "undefined") return;
  const expires = days
    ? `; expires=${new Date(Date.now() + days * 86_400_000).toUTCString()}`
    : "";
  document.cookie = `${name}=${value}; path=/; SameSite=Lax${expires}`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
};

export const setAuthUser = (user: AuthUser): void => {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCookie(
      USER_COOKIE,
      encodeURIComponent(JSON.stringify(user)),
      COOKIE_DAYS,
    );
  } catch (e) {
    console.error("setAuthUser:", e);
  }
};

export const getAuthUser = (): AuthUser | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const clearAuthUser = (): void => {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    removeCookie(USER_COOKIE);
  } catch (e) {
    console.error("clearAuthUser:", e);
  }
};

export const isAuthenticated = (): boolean => !!getAuthUser();
