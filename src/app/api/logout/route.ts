import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/auth";

// Clears the NNAK session cookie via a proper Set-Cookie header so the
// middleware no longer treats the request as authenticated. Token revocation
// is performed separately by the /api/v1/logout call on the backend.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(USER_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  });
  return response;
}
