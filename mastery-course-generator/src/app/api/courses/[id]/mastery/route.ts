/**
 * API: Mastery overview for a course.
 *
 * GET /api/courses/:id/mastery - list mastery records + learner recommendations
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { requireCourseAccess } from '@/lib/course-access';
import { toAppError } from '@/lib/errors';
import { listMastery, recommendActions } from '@/services/mastery';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    requireCourseAccess(id, userId, 'learner');

    const listing = listMastery(id, userId);
    const recommendations = recommendActions(id, userId);

    return NextResponse.json({
      ...listing,
      recommendations,
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}