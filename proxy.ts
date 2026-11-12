import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check: only looks for the session cookie, without a database call.
 * Pages and API route handlers still validate the session themselves.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  // Everything except the auth API, the sign-in page and static assets requires a session.
  matcher: [
    "/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
