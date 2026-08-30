/**
 * API: Course workspace data (units, lessons, objectives, etc.)
 *
 * GET /api/courses/:id/workspace - get all curriculum entities for a course
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { requireCourseAccess } from '@/lib/course-access';
import { listUnits, listObjectives, listLessons, listAssessments, listQuestions } from '@/db/repo';
import { toAppError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    requireCourseAccess(id, userId, 'learner');

    const units = listUnits(id);
    const objectives = listObjectives(id);
    const lessons = listLessons(id);
    const assessments = listAssessments(id);
    const questions = listQuestions(id);

    return NextResponse.json({
      units,
      objectives,
      lessons,
      assessments,
      questions,
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}