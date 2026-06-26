import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/nnak/login",
  "/nnak/register",
  "/nnak/verify-otp",
  "/nnak/forgot-password",
  "/nnak/reset-password",
  "/unauthorized",
  "/nnak/register/student",
];

const NNAK_ROLE_GUARDS: { prefix: string; allow: string[] }[] = [
  { prefix: "/nnak/categories", allow: ["super_admin", "admin"] },
  { prefix: "/nnak/byproduct", allow: ["super_admin", "admin", "finance"] },
  { prefix: "/nnak/events", allow: ["super_admin", "admin", "events"] },
  { prefix: "/nnak/checkin", allow: ["super_admin", "admin", "events"] },
  { prefix: "/nnak/payments", allow: ["super_admin", "admin", "finance", "executive"] },
  { prefix: "/nnak/ilm", allow: ["super_admin", "admin"] },
  { prefix: "/nnak/branch-invites", allow: ["super_admin", "admin"] },
  { prefix: "/nnak/branch-transfers", allow: ["super_admin", "admin"] },
  {
    prefix: "/nnak/finance",
    allow: ["super_admin", "admin", "finance"],
  },
  {
    prefix: "/nnak/branch/invites",
    allow: ["branch_manager", "branch"],
  },
  {
    prefix: "/nnak/branch/transfers",
    allow: ["branch_manager", "branch"],
  },
  {
    prefix: "/nnak/branch/batches",
    allow: ["branch_manager", "branch"],
  },
];

interface MiniUser {
  id?: string;
  email?: string;
  role?: string;
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

const isAuthed = (request: NextRequest): boolean =>
  !!request.cookies.get("nnak_user")?.value;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isAuthed(request);

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isPublic) {
    if (pathname === "/nnak/login" && authed) {
      return NextResponse.redirect(new URL("/nnak/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authed ? "/nnak/dashboard" : "/nnak/login", request.url),
    );
  }

  if (!authed) {
    const loginUrl = new URL("/nnak/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/nnak")) {
    const nnakUser = getNnakUserFromCookie(request);

    // Send finance users straight to their dashboard on first load
    if (pathname === "/nnak/dashboard" && nnakUser?.role === "finance") {
      return NextResponse.redirect(new URL("/nnak/finance/dashboard", request.url));
    }

    for (const guard of NNAK_ROLE_GUARDS) {
      if (
        pathname.startsWith(guard.prefix) &&
        !guard.allow.includes(nnakUser?.role || "")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)"],
};
