/**
 * API: Course listing and creation.
 *
 * GET /api/courses        - list user's courses
 * POST /api/courses       - create a new course
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId } from '@/lib/auth';
import { createCourse, listCoursesForUser } from '@/db/repo';
import { toAppError } from '@/lib/errors';

const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  subjectDomain: z.string().optional(),
  targetLevel: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/courses
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const userCourses = listCoursesForUser(userId);
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
      description: parsed.data.description,
      subjectDomain: parsed.data.subjectDomain,
      targetLevel: parsed.data.targetLevel,
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