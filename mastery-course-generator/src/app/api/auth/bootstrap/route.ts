/**
 * API: Guest session bootstrap.
 *
 * POST /api/auth/bootstrap - ensure the browser has a session.
 *
 * If a valid session cookie is already present, it is kept. Otherwise a
 * fresh guest user is created and signed in, so each browser gets its own
 * private courses even before creating an account. Signing up later upgrades
 * the guest in place, keeping their courses.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  encodeSession,
  newUserId,
  readSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth';
import { getUserById, createUser } from '@/db/repo';
import { toAppError } from '@/lib/errors';

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await readSession();
    if (session && getUserById(session.userId)) {
      return NextResponse.json({ ok: true, userId: session.userId });
    }

    const id = newUserId();
    const user = createUser({
      id,
      email: `guest-${id}@mastery.local`,
      displayName: 'Guest',
      role: 'teacher',
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, encodeSession(user.id), sessionCookieOptions());
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
