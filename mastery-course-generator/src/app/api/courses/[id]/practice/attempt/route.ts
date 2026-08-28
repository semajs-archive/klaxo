/**
 * API: Record a practice/assessment attempt and update mastery.
 *
 * POST /api/courses/:id/practice/attempt
 * body: { questionId, objectiveId, response, durationMs? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';
import { recordAttempt } from '@/services/mastery';

const AttemptSchema = z.object({
  questionId: z.string().min(1),
  objectiveId: z.string().min(1),
  response: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.string(), z.unknown())]),
  durationMs: z.number().int().nonnegative().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const body = await req.json().catch(() => null);
    const parsed = AttemptSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { questionId, objectiveId, response, durationMs } = parsed.data;

    const result = recordAttempt({
      courseId: id,
      userId,
      questionId,
      objectiveId,
      response,
      durationMs,
    });

    return NextResponse.json(
      {
        attempt: result.attempt,
        mastery: result.mastery,
        recommendation: result.recommendation,
      },
      { status: 201 },
    );
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}