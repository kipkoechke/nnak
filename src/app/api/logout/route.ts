import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/auth";

// This route clears the ehl_user cookie via a proper Set-Cookie response
// header. This is more reliable than document.cookie manipulation on the
// client, which can silently fail in some browser/localhost scenarios.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(USER_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  });
  return response;
}
