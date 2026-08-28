/**
 * API: Source document analysis.
 *
 * POST /api/courses/:id/analyze       - analyze a source document into a knowledge package
 *   body: { documentId: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { getCourse, getSourceDocument } from '@/db/repo';
import { analyzeSource } from '@/services/source-analysis';
import { notFound, toAppError } from '@/lib/errors';

const AnalyzeSchema = z.object({
  documentId: z.string().min(1),
});

/**
 * POST /api/courses/:id/analyze
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
    const parsed = AnalyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const doc = getSourceDocument(parsed.data.documentId);
    if (!doc) throw notFound('Source document not found');
    if (doc.courseId !== id) throw notFound('Source document not found');

    const result = await analyzeSource({
      courseId: id,
      documentId: parsed.data.documentId,
    });

    return NextResponse.json({ result });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}