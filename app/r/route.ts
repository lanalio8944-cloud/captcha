import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  expiredSessionCookieOptions,
  getDestinationBySession,
  getRedirectSession,
  SESSION_COOKIE,
} from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = session ? getRedirectSession(session) : null;

  const denied = () => {
    const response = NextResponse.redirect(new URL("/", request.url), 303);
    response.cookies.set(SESSION_COOKIE, "", expiredSessionCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (!payload) return denied();

  const destination = getDestinationBySession(payload);
  if (!destination) {
    return new NextResponse("Redirect destination is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const response = NextResponse.redirect(destination, 302);
  response.cookies.set(SESSION_COOKIE, "", expiredSessionCookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
