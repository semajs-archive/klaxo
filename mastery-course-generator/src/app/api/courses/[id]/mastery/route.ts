/**
 * API: Mastery overview for a course.
 *
 * GET /api/courses/:id/mastery - list mastery records + learner recommendations
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getCourse } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';
import { listMastery, recommendActions } from '@/services/mastery';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

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