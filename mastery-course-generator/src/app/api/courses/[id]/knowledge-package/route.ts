/**
 * API: Knowledge package (source understanding).
 *
 * GET  /api/courses/:id/knowledge-package         - get latest knowledge package
 * PATCH /api/courses/:id/knowledge-package        - approve or edit knowledge package
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse, getLatestKnowledgePackage, updateKnowledgePackage, listSourceFragments } from '@/db/repo';
import { notFound, toAppError } from '@/lib/errors';

const UpdateKnowledgePackageSchema = z.object({
  payload: z.string().optional(),
  status: z.enum(['draft', 'approved']).optional(),
  detectedTitle: z.string().optional(),
  detectedSubject: z.string().optional(),
  detectedLevel: z.string().optional(),
  summary: z.string().optional(),
  origin: z.enum(['AI_GENERATED', 'USER_EDITED']).optional(),
});

/**
 * GET /api/courses/:id/knowledge-package
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

    const kp = getLatestKnowledgePackage(id);
    if (!kp) {
      return NextResponse.json({ knowledgePackage: null });
    }

    // Parse the payload
    const analysis = JSON.parse(kp.payload);

    // Also get source fragments for provenance review
    const fragments = listSourceFragments(id);

    return NextResponse.json({
      knowledgePackage: { ...kp, analysis },
      fragments,
    });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}

/**
 * PATCH /api/courses/:id/knowledge-package
 */
export async function PATCH(
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
    const parsed = UpdateKnowledgePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const kp = getLatestKnowledgePackage(id);
    if (!kp) throw notFound('No knowledge package found');

    const updated = updateKnowledgePackage(kp.id, {
      ...parsed.data,
      payload: parsed.data.payload ?? kp.payload,
      status: parsed.data.status ?? kp.status,
      approvedAt: parsed.data.status === 'approved' ? Date.now() : undefined,
    });

    return NextResponse.json({ knowledgePackage: updated });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}