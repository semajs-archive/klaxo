/**
 * API: Single generation job status + cancellation.
 *
 * GET    /api/courses/:id/jobs/:jobId           - get job status/progress + events
 * POST   /api/courses/:id/jobs/:jobId/cancel    - request cancellation
 *
 * Cancellation marks the job CANCELLED and stops any in-flight execution at the
 * next checkpoint. Already-persisted data is preserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getCourse, getGenerationJob, listGenerationEvents } from '@/db/repo';
import { cancelJob } from '@/pipeline/orchestrator';
import { notFound, toAppError } from '@/lib/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id, jobId } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const job = getGenerationJob(jobId);
    if (!job || job.courseId !== id) throw notFound('Job not found');

    const events = listGenerationEvents(jobId);

    return NextResponse.json({ job, events });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id, jobId } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const job = getGenerationJob(jobId);
    if (!job || job.courseId !== id) throw notFound('Job not found');

    const result = cancelJob(jobId);

    return NextResponse.json({
      jobId,
      cancelled: result.cancelled,
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}