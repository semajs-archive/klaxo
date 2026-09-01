/**
 * API: Course listing and creation.
 *
 * GET /api/courses        - list user's courses
 * POST /api/courses       - create a new course
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { createCourse, listCoursesForUser, listObjectives, listQuestions } from '@/db/repo';
import { toAppError } from '@/lib/errors';

const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  subjectDomain: z.string().nullish(),
  targetLevel: z.string().nullish(),
  preferences: z.record(z.string(), z.unknown()).nullish(),
});

/**
 * GET /api/courses
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    // The stored status column is set once at creation and never moves, so a
    // finished course still called itself a draft. What the list actually needs
    // to say is whether there is anything to practise yet, and that is a count.
    const userCourses = listCoursesForUser(userId).map((c) => ({
      ...c,
      objectiveCount: listObjectives(c.id).length,
      questionCount: listQuestions(c.id).length,
    }));
    return NextResponse.json({ courses: userCourses });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}

/**
 * POST /api/courses
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = CreateCourseSchema.safeParse(body);
  
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
  
    const { randomUUID } = await import('node:crypto');
    const courseId = `crs_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const course = createCourse({
      id: courseId,
      userId,
      title: parsed.data.title,
      description: parsed.data.description ?? undefined,
      subjectDomain: parsed.data.subjectDomain ?? undefined,
      targetLevel: parsed.data.targetLevel ?? undefined,
      preferences: parsed.data.preferences ? JSON.stringify(parsed.data.preferences) : undefined,
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}