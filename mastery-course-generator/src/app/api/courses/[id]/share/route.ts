/**
 * API: Course share link (owner only).
 *
 * GET    /api/courses/:id/share - current link + who has joined, with mastery
 * POST   /api/courses/:id/share - create (or return) the active share link
 * DELETE /api/courses/:id/share - revoke the active link
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { requireUserId } from '@/lib/auth';
import { requireCourseAccess } from '@/lib/course-access';
import {
  createCourseShare,
  getActiveShareForCourse,
  listEnrollments,
  listMasteryRecords,
  listObjectives,
  revokeShare,
} from '@/db/repo';
import { toAppError } from '@/lib/errors';

function newShareId(): string {
  return `shr_${randomBytes(12).toString('hex')}`;
}

function newShareToken(): string {
  return randomBytes(16).toString('base64url');
}

function shareSummary(courseId: string) {
  const share = getActiveShareForCourse(courseId);
  const objectiveCount = listObjectives(courseId).length;
  const students = listEnrollments(courseId).map((e) => {
    const mastered = listMasteryRecords(courseId, e.userId).filter(
      (m) => m.state === 'MASTERED',
    ).length;
    return {
      userId: e.userId,
      name: e.displayName ?? 'Learner',
      joinedAt: e.joinedAt,
      mastered,
      objectiveCount,
    };
  });
  return { share: share ? { token: share.token, createdAt: share.createdAt } : null, students };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    requireCourseAccess(id, userId, 'owner');
    return NextResponse.json(shareSummary(id));
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    requireCourseAccess(id, userId, 'owner');

    if (!getActiveShareForCourse(id)) {
      createCourseShare({ id: newShareId(), courseId: id, token: newShareToken() });
    }
    return NextResponse.json(shareSummary(id), { status: 201 });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    requireCourseAccess(id, userId, 'owner');

    const share = getActiveShareForCourse(id);
    if (share) revokeShare(share.id);
    return NextResponse.json(shareSummary(id));
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}
