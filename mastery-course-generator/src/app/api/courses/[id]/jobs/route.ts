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
import { createGenerationJob, listGenerationJobs } from '@/db/repo';
import { runJob } from '@/pipeline/orchestrator';
import { notFound, toAppError } from '@/lib/errors';

import { randomUUID } from 'node:crypto';

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

    const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    createGenerationJob({
      id: jobId,
      courseId: id,
      userId,
      kind: parsed.data.kind,
      requestKey: parsed.data.requestKey,
      input: parsed.data.input ? JSON.stringify(parsed.data.input) : undefined,
    });

    // Fire-and-forget execution; the job runner updates progress.
    runJob(jobId).catch((err) => {
      // Error is already recorded in the job by runJob.
      console.error('Job failed:', err);
    });

    return NextResponse.json({ jobId, created: true }, { status: 201 });
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