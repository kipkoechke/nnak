"use client";
import { useEffect, useRef } from "react";
import { nnakAuth } from "@/services/auth.service";
import {
  getNnakToken,
  getNnakTokenTtl,
  updateNnakToken,
} from "@/lib/auth";
import { isDemoSession } from "@/lib/demo-token";

// How often the loop wakes to evaluate whether a refresh is due.
const CHECK_INTERVAL_MS = 60_000;
// Refresh once the token has this little life left…
const REFRESH_BEFORE_MS = 5 * 60_000;
// …but only if the user has interacted within this window (session "active").
const ACTIVE_WINDOW_MS = 15 * 60_000;

/**
 * Keeps a live session's Sanctum token fresh: while the user is active, it
 * calls POST /refresh-token shortly before the current token expires so the
 * user isn't logged out mid-work. Idle sessions are left to expire naturally.
 * Mounted once, app-wide, from Providers.
 */
export function useTokenRefresh() {
  const lastActivity = useRef<number>(Date.now());
  const refreshing = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
    ];
    activityEvents.forEach((e) =>
      window.addEventListener(e, markActive, { passive: true }),
    );

    const maybeRefresh = async () => {
      if (refreshing.current) return;
      if (isDemoSession()) return;
      if (!getNnakToken()) return; // not signed in

      const ttl = getNnakTokenTtl();
      // Unknown TTL — nothing to base a decision on; skip.
      if (ttl === null) return;
      // Still plenty of life left.
      if (ttl > REFRESH_BEFORE_MS) return;
      // Session gone idle — let it expire.
      if (Date.now() - lastActivity.current > ACTIVE_WINDOW_MS) return;

      refreshing.current = true;
      try {
        const r = await nnakAuth.refreshToken();
        if (r?.token) updateNnakToken(r.token, r.expires_at ?? r.expires_in);
      } catch {
        // A failure here (e.g. 401) is handled by the axios interceptor.
      } finally {
        refreshing.current = false;
      }
    };

    // Evaluate right away, then on an interval.
    void maybeRefresh();
    const id = window.setInterval(() => void maybeRefresh(), CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
      activityEvents.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, []);
}
