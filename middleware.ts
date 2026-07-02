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

/**
 * Build an absolute URL with the correct protocol.
 *
 * nginx terminates TLS and proxies to Next.js over plain HTTP, so
 * `request.url` always contains `http://`.  We read the `x-forwarded-proto`
 * header that nginx sets (`$scheme`) to construct HTTPS URLs in production.
 */
function buildUrl(path: string, request: NextRequest): URL {
  const url = new URL(path, request.url);
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "https") {
    url.protocol = "https:";
  }
  return url;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isAuthed(request);

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (isPublic) {
    if (pathname === "/nnak/login" && authed) {
      return NextResponse.redirect(buildUrl("/nnak/dashboard", request));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      buildUrl(authed ? "/nnak/dashboard" : "/nnak/login", request),
    );
  }

  if (!authed) {
    const loginUrl = buildUrl("/nnak/login", request);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/nnak")) {
    const nnakUser = getNnakUserFromCookie(request);

    // Send finance users straight to their dashboard on first load
    if (pathname === "/nnak/dashboard" && nnakUser?.role === "finance") {
      return NextResponse.redirect(buildUrl("/nnak/finance/dashboard", request));
    }

    for (const guard of NNAK_ROLE_GUARDS) {
      if (
        pathname.startsWith(guard.prefix) &&
        !guard.allow.includes(nnakUser?.role || "")
      ) {
        return NextResponse.redirect(buildUrl("/unauthorized", request));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)"],
};
