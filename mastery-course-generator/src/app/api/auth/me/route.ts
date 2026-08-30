/**
 * API: Current account.
 *
 * GET /api/auth/me - who is signed in, if anyone.
 */
import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import { getUserById } from '@/db/repo';
import { toAppError } from '@/lib/errors';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await readSession();
    const user = session ? getUserById(session.userId) : undefined;
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isGuest: !user.passwordHash && user.role !== 'student',
      },
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
