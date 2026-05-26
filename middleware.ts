import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/nnak/login",
  "/nnak/register",
  "/nnak/verify-otp",
  "/nnak/forgot-password",
  "/nnak/reset-password",
];

const NNAK_ROLE_GUARDS: { prefix: string; allow: string[] }[] = [
  { prefix: "/nnak/categories", allow: ["super_admin", "admin"] },
  { prefix: "/nnak/byproduct", allow: ["super_admin", "admin", "finance"] },
  { prefix: "/nnak/events", allow: ["super_admin", "admin", "events"] },
  { prefix: "/nnak/checkin", allow: ["super_admin", "admin", "events"] },
  { prefix: "/nnak/payments", allow: ["super_admin", "admin", "finance", "executive"] },
  { prefix: "/nnak/ilm", allow: ["super_admin", "admin"] },
];

interface MiniUser {
  id?: string;
  email?: string;
  role?: string;
}

function getUserFromCookie(request: NextRequest): MiniUser | null {
  try {
    const raw = request.cookies.get("ehl_user")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function isAuthed(request: NextRequest): boolean {
  return (
    !!request.cookies.get("ehl_user")?.value ||
    !!request.cookies.get("nnak_user")?.value
  );
}

function getNnakUserFromCookie(request: NextRequest): MiniUser | null {
  try {
    const raw = request.cookies.get("nnak_user")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isAuthed(request);

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isPublic) {
    if (pathname === "/login" && authed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname === "/nnak/login" && request.cookies.get("nnak_user")?.value) {
      return NextResponse.redirect(new URL("/nnak/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const loginUrl = new URL(
      pathname.startsWith("/nnak") ? "/nnak/login" : "/login",
      request.url,
    );
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NNAK route role guards
  if (pathname.startsWith("/nnak")) {
    const nnakUser = getNnakUserFromCookie(request);
    if (!nnakUser) {
      const loginUrl = new URL("/nnak/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    for (const guard of NNAK_ROLE_GUARDS) {
      if (pathname.startsWith(guard.prefix) && !guard.allow.includes(nnakUser.role || "")) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  const user = getUserFromCookie(request);
  const role = user?.role;
  const adminOnly = ["/users"];
  if (
    adminOnly.some((p) => pathname.startsWith(p)) &&
    role &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)"],
};
