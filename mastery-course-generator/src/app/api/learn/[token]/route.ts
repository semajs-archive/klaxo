/**
 * API: Share-link lookup.
 *
 * GET /api/learn/:token - course info for a share link, plus whether the
 * current browser has already joined. No authentication required; knowing
 * the token IS the invitation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import { getCourse, getEnrollment, getShareByToken, getUserById } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  try {
    const { token } = await params;
    const share = getShareByToken(token);
    if (!share || share.revokedAt != null) throw notFound('This invite link is no longer active.');
    const course = getCourse(share.courseId);
    if (!course) throw notFound('This invite link is no longer active.');

    const session = await readSession();
    const user = session ? getUserById(session.userId) : undefined;
    const isOwner = user?.id === course.userId;
    const enrolled = user ? Boolean(getEnrollment(course.id, user.id)) : false;

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        subjectDomain: course.subjectDomain,
        targetLevel: course.targetLevel,
      },
      joined: isOwner || enrolled,
      isOwner,
      displayName: user?.displayName ?? null,
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
