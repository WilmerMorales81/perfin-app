import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Keep in sync with `src/lib/session.ts` */
const SESSION_COOKIE = "perfin_session";

function getSecretBytes() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = getSecretBytes();
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // invalid session cookie — allow login page
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
