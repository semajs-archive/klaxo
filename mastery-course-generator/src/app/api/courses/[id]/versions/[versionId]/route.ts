/**
 * API: Single course version (get + publish + restore).
 *
 * GET  /api/courses/:id/versions/:versionId - get a version + parsed snapshot
 * POST /api/courses/:id/versions/:versionId - action: 'publish' | 'restore'
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse, getCourseVersion } from '@/db/repo';
import { notFound, badRequest, toAppError } from '@/lib/errors';
import { publishVersion, restoreVersion } from '@/services/versioning';

const ActionSchema = z.object({
  action: z.enum(['publish', 'restore']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id, versionId } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const version = getCourseVersion(versionId);
    if (!version || version.courseId !== id) throw notFound('Version not found');

    const snapshot = version.snapshot ? JSON.parse(version.snapshot) : null;

    return NextResponse.json({ version, snapshot });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id, versionId } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const body = await req.json().catch(() => null);
    const parsed = ActionSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw badRequest('Invalid action', parsed.error.flatten());
    }

    if (parsed.data.action === 'publish') {
      const version = publishVersion(id, versionId, userId);
      return NextResponse.json({ version });
    }

    restoreVersion(id, versionId, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
}