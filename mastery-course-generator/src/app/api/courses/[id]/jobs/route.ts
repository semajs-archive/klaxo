/**
 * API: Generation job management.
 *
 * POST /api/courses/:id/jobs          - start a new generation job
 * GET  /api/courses/:id/jobs          - list jobs for a course
 * GET  /api/courses/:id/jobs/:jobId   - get job status/progress
 * POST /api/courses/:id/jobs/:jobId/cancel - cancel a running job
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse } from '@/db/repo';
import { listGenerationJobs } from '@/db/repo';
import { runJob, startJob } from '@/pipeline/orchestrator';
import { notFound, toAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const StartJobSchema = z.object({
  kind: z.enum(['ANALYZE_SOURCE', 'BLUEPRINT', 'GENERATE_COURSE', 'REGENERATE_LESSON', 'QA', 'REVISE']),
  requestKey: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/courses/:id/jobs
 */
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

    const body = await req.json();
    const parsed = StartJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Use idempotent job creation
    const { jobId, created } = startJob({
      courseId: id,
      userId,
      kind: parsed.data.kind,
      requestKey: parsed.data.requestKey,
      input: parsed.data.input,
    });

    if (created) {
      // Durable execution: the dedicated worker (`npm run worker`) is the
      // production-grade executor. For single-process dev without the worker,
      // kick the job off in-process as a best-effort fallback. The job's state
      // is persisted in the DB, so a request dying mid-flight never loses work —
      // the worker (or a later recovery pass) resumes it.
      runJob(jobId).catch((err) => {
        // Error is already recorded on the job by runJob; log via structured logger.
        logger.error('In-process job execution failed', { jobId, error: (err as Error).message });
      });
    }

    return NextResponse.json({ jobId, created }, { status: created ? 201 : 200 });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}

/**
 * GET /api/courses/:id/jobs
 */
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

    const jobs = listGenerationJobs(id);
    return NextResponse.json({ jobs });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}