/**
 * API: Join a course through a share link.
 *
 * POST /api/learn/:token/join { name }
 *
 * Learners don't need accounts: joining creates a lightweight student user
 * tied to this browser's session cookie, so their practice and mastery are
 * tracked under their own name.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  encodeSession,
  newUserId,
  readSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth';
import {
  createEnrollment,
  createUser,
  getCourse,
  getEnrollment,
  getShareByToken,
  getUserById,
  updateUserAccount,
} from '@/db/repo';
import { consume } from '@/lib/rate-limit';
import { notFound, rateLimited, toAppError } from '@/lib/errors';

const JoinSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  try {
    const { token } = await params;
    if (!consume(`join:${token}`, 30).ok) {
      throw rateLimited('Too many join attempts. Wait a minute and try again.');
    }

    const share = getShareByToken(token);
    if (!share || share.revokedAt != null) throw notFound('This invite link is no longer active.');
    const course = getCourse(share.courseId);
    if (!course) throw notFound('This invite link is no longer active.');

    const body = await req.json().catch(() => ({}));
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your name to join.' }, { status: 400 });
    }
    const name = parsed.data.name;

    const session = await readSession();
    let user = session ? getUserById(session.userId) : undefined;

    // The owner opening their own link just goes to the course.
    if (user && user.id === course.userId) {
      return NextResponse.json({ courseId: course.id, access: 'owner' });
    }

    if (!user) {
      const id = newUserId();
      user = createUser({
        id,
        email: `student-${randomBytes(8).toString('hex')}@mastery.local`,
        displayName: name,
        role: 'student',
      });
      const store = await cookies();
      store.set(SESSION_COOKIE, encodeSession(user.id), sessionCookieOptions());
    } else if (!user.passwordHash && user.displayName !== name) {
      // Guest sessions adopt the name typed at join time.
      user = updateUserAccount(user.id, { displayName: name });
    }

    if (!getEnrollment(course.id, user.id)) {
      createEnrollment({
        id: `enr_${randomBytes(12).toString('hex')}`,
        courseId: course.id,
        userId: user.id,
        shareId: share.id,
      });
    }

    return NextResponse.json({ courseId: course.id, access: 'learner' }, { status: 201 });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
