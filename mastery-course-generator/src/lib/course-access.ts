/**
 * Course access control.
 *
 * Two levels: the owner (the teacher who built the course) and learners
 * (users enrolled through a share link). Learners can read the course and
 * record their own practice/mastery; everything that mutates the course
 * itself stays owner-only. Non-members get the same "not found" as before,
 * so course ids stay unguessable.
 */
import { getCourse, getEnrollment } from '@/db/repo';
import { notFound } from './errors';

export type CourseAccess = 'owner' | 'learner';

type CourseRow = NonNullable<ReturnType<typeof getCourse>>;

export function resolveCourseAccess(
  course: CourseRow,
  userId: string,
): CourseAccess | null {
  if (course.userId === userId) return 'owner';
  if (getEnrollment(course.id, userId)) return 'learner';
  return null;
}

/**
 * Load the course and assert the caller has at least the given access level.
 * Throws the usual 404 otherwise.
 */
export function requireCourseAccess(
  courseId: string,
  userId: string,
  minimum: CourseAccess,
): { course: CourseRow; access: CourseAccess } {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  const access = resolveCourseAccess(course, userId);
  if (!access) throw notFound('Course not found');
  if (minimum === 'owner' && access !== 'owner') throw notFound('Course not found');
  return { course, access };
}
