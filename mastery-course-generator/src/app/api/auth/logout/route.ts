/**
 * API: Sign out.
 *
 * POST /api/auth/logout - clear the session cookie.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
