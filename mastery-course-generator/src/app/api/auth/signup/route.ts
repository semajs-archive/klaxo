/**
 * API: Account creation.
 *
 * POST /api/auth/signup { email, password, displayName? }
 *
 * If the caller already has a guest session, that user is upgraded in place
 * (email + password attached) so any courses they built as a guest stay
 * theirs. Otherwise a fresh account is created. Either way the session cookie
 * is (re)issued for the account.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  encodeSession,
  newUserId,
  readSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth';
import { hashPassword } from '@/lib/passwords';
import { createUser, getUserByEmail, getUserById, updateUserAccount } from '@/db/repo';
import { toAppError } from '@/lib/errors';

const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(100).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid email and a password of at least 8 characters.' },
        { status: 400 },
      );
    }
    const { email, password, displayName } = parsed.data;

    if (getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'An account with that email already exists. Sign in instead.' },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);

    // Upgrade the current guest user when possible so their courses carry over.
    const session = await readSession();
    const existing = session ? getUserById(session.userId) : undefined;

    let user;
    if (existing && !existing.passwordHash) {
      user = updateUserAccount(existing.id, {
        email,
        passwordHash,
        role: 'teacher',
        ...(displayName ? { displayName } : {}),
      });
    } else {
      user = createUser({
        id: newUserId(),
        email,
        passwordHash,
        displayName,
        role: 'teacher',
      });
    }

    const store = await cookies();
    store.set(SESSION_COOKIE, encodeSession(user.id), sessionCookieOptions());
    return NextResponse.json(
      { user: { id: user.id, email: user.email, displayName: user.displayName } },
      { status: 201 },
    );
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
