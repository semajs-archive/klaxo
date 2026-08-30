/**
 * API: Sign in.
 *
 * POST /api/auth/login { email, password }
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { verifyPassword } from '@/lib/passwords';
import { getUserByEmail } from '@/db/repo';
import { consume } from '@/lib/rate-limit';
import { rateLimited, toAppError } from '@/lib/errors';

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
    }
    const { email, password } = parsed.data;

    if (!consume(`login:${email}`, 10).ok) {
      throw rateLimited('Too many sign-in attempts. Wait a minute and try again.');
    }

    const user = getUserByEmail(email);
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'That email and password don’t match.' },
        { status: 401 },
      );
    }

    const store = await cookies();
    store.set(SESSION_COOKIE, encodeSession(user.id), sessionCookieOptions());
    return NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
