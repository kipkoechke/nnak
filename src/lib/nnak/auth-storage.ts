import type { NnakUser } from "@/types/nnak";
import { NNAK_TOKEN_KEY, NNAK_USER_COOKIE } from "./api";

const STORAGE_KEY = "nnak_user";

const setCookie = (name: string, value: string, days = 30) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
};

export const setNnakSession = (user: NnakUser, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(NNAK_TOKEN_KEY, token);
  setCookie(NNAK_USER_COOKIE, encodeURIComponent(JSON.stringify({
    id: user.id, email: user.email, role: user.role, name: user.name,
  })));
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
  removeCookie(NNAK_USER_COOKIE);
};
