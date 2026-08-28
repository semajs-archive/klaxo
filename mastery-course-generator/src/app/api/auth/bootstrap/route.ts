/**
 * API: Demo session bootstrap.
 *
 * POST /api/auth/bootstrap - create a demo user and sign a session cookie.
 * This is a development convenience that provides ownership isolation without
 * a full identity provider. It creates (or reuses) a demo user keyed by a
 * fixed email and issues an HMAC-signed httpOnly cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encodeSession, newUserId, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { getUserByEmail, createUser } from '@/db/repo';
import { toAppError } from '@/lib/errors';

const DEMO_EMAIL = 'demo@mastery.local';

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    let user = getUserByEmail(DEMO_EMAIL);
    if (!user) {
      user = createUser({
        id: newUserId(),
        email: DEMO_EMAIL,
        displayName: 'Demo Learner',
      });
    }

    const token = encodeSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions());

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}