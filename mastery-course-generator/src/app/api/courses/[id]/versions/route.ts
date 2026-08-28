/**
 * API: Course versions (list + create).
 *
 * GET  /api/courses/:id/versions - list versions for a course
 * POST /api/courses/:id/versions - create a new draft snapshot (body: { label?, notes? })
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';
import { createVersion, listVersions } from '@/services/versioning';

const CreateVersionSchema = z.object({
  label: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
});

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

    const versions = listVersions(id, userId);

    return NextResponse.json({ versions });
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

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const body = await req.json().catch(() => null);
    const parsed = CreateVersionSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = createVersion(id, userId, parsed.data);

    return NextResponse.json(
      { version: result.version, versionNumber: result.versionNumber },
      { status: 201 },
    );
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}