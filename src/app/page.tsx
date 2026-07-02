"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Root page — middleware handles the primary redirect (server-side).
 * This client-side fallback only runs if middleware is bypassed.
 * It reads the nnak_user cookie to decide where to send the user,
 * matching the middleware logic exactly.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasSession = document.cookie
      .split("; ")
      .some((c) => c.startsWith("nnak_user="));
    router.replace(hasSession ? "/nnak/dashboard" : "/nnak/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
