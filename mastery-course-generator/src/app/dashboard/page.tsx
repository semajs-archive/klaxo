'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subjectDomain: string | null;
  status: string;
  stage: string;
  updatedAt: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function ensureSession() {
    try {
      await fetch('/api/auth/bootstrap', { method: 'POST' });
    } catch (err) {
      console.error('Failed to bootstrap session:', err);
    }
  }

  async function fetchCourses() {
    try {
      await ensureSession();
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    let mounted = true;
    fetchCourses().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, []);

  async function createCourse() {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Course' }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/wizard/${data.course.id}`);
    }
  }

  const filteredCourses = courses.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">Manage and create mastery-oriented courses</p>
        </div>
        <Button onClick={createCourse}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Course
        </Button>
      </div>

      <Input
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md mb-6"
      />

      {filteredCourses.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <svg className="mx-auto h-12 w-12 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No courses yet</h3>
            <p className="text-muted-foreground mt-1">Create your first mastery course</p>
            <Button onClick={createCourse} className="mt-4">
              Create Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="truncate">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {course.subjectDomain && (
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">{course.subjectDomain}</span>
                  )}
                  <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">{course.status}</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">{course.stage}</span>
                </div>
                <Link
                  href={`/wizard/${course.id}`}
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                >
                  Continue wizard →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}