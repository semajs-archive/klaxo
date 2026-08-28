/**
 * API: Single-objective mastery.
 *
 * GET /api/courses/:id/mastery/:objectiveId
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getCourse } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';
import { getSingleMastery } from '@/services/mastery';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id, objectiveId } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const mastery = getSingleMastery(id, userId, objectiveId);

    return NextResponse.json({ mastery });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}