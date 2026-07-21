/**
 * Same-origin proxy for NNAK-hosted images.
 *
 * The storage host serves images without an `Access-Control-Allow-Origin`
 * header. A DOM <img> renders them fine, but a browser `fetch()` is blocked —
 * which breaks embedding the member photo into the digital ID PDF, since
 * @react-pdf needs the raw bytes. Server-to-server requests aren't subject to
 * CORS, so routing through here returns the bytes same-origin.
 *
 * Scoped to the configured API host so this can't be used as an open proxy.
 */
import { NextRequest, NextResponse } from "next/server";

const apiBase =
  process.env.NEXT_PUBLIC_NNAK_API_URL || "https://api.nnak.or.ke/api/v1";

/** Hosts this proxy will fetch from — the API host only. */
const allowedHosts = new Set<string>();
try {
  allowedHosts.add(new URL(apiBase).host);
} catch {
  // Malformed base URL — the allowlist simply stays empty and all
  // requests are rejected, which is the safe failure mode.
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.host)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    // Don't forward cookies or auth — these are public storage assets.
    cache: "no-store",
  }).catch(() => null);

  if (!upstream?.ok) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Not an image" }, { status: 415 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
