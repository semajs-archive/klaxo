/**
 * The front door.
 *
 * The site's primary button lands here, and the promise it makes is that
 * clicking it opens the builder — not a signup form. So this route does the
 * whole first-run in one hop: make sure there is a session (reusing an
 * existing one rather than handing someone a second identity), create an empty
 * course, and redirect into its builder.
 *
 * Signing up later upgrades the guest in place and keeps everything they built.
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
import { createUser, getUserById, createCourse } from '@/db/repo';
import { newId } from '@/lib/ids';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const store = await cookies();
    const session = await readSession();

    let userId = session && getUserById(session.userId) ? session.userId : null;

    if (!userId) {
      const id = newUserId();
      const user = createUser({
        id,
        email: `guest-${id}@mastery.local`,
        displayName: 'Guest',
        role: 'teacher',
      });
      userId = user.id;
      store.set(SESSION_COOKIE, encodeSession(user.id), sessionCookieOptions());
    }

    const course = createCourse({
      id: newId('crs'),
      userId,
      title: 'Untitled Course',
    });

    return NextResponse.redirect(new URL(`/wizard/${course.id}`, req.url));
  } catch (err) {
    // Never strand someone on an error page at the front door — send them to
    // the dashboard, which can recover on its own.
    logger.error('guest start failed', { err });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}
