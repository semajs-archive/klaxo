import { NextRequest, NextResponse } from 'next/server';

/**
 * Front-door routing.
 *
 * The public site is open to everyone; the product is not. Anyone who reaches
 * an app route without a session cookie is sent to sign in and returned to
 * where they were headed afterwards.
 *
 * This is a routing check, not an authorization check: it only looks for the
 * presence of the cookie. Every API route still verifies the signature and
 * ownership server-side, which is where access is actually enforced.
 *
 * `/learn/*` is deliberately excluded — share links are how students get in,
 * and they never have accounts.
 */
const SESSION_COOKIE = 'mcg_session';

export function middleware(req: NextRequest) {
  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/wizard/:path*', '/workspace/:path*'],
};
