'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string;
}

interface Unit {
  id: string;
  title: string;
  ordinal: number;
  description: string | null;
  classification: string;
}

interface Lesson {
  id: string;
  title: string;
  unitId: string;
  ordinal: number;
  status: string;
}

const TABS = ['curriculum', 'lessons', 'practice', 'assessments', 'mastery', 'versions'] as const;

export default function WorkspacePage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [loading, setLoading] = useState(true);

  // Function declarations first (hoisted)
  async function fetchWorkspace() {
    try {
      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
      }

      const workspaceRes = await fetch(`/api/courses/${courseId}/workspace`);
      if (workspaceRes.ok) {
        const data = await workspaceRes.json();
        setUnits(data.units || []);
        setLessons(data.lessons || []);
      }
    } catch (err) {
      console.error('Failed to fetch workspace:', err);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    let mounted = true;
    fetchWorkspace().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          \u2190 Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description || 'No description'}</p>
      </div>

      <div className="flex gap-4 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            {units.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No units generated yet. Complete the wizard to generate your course.</p>
                  <Link href={`/wizard/${courseId}`} className="mt-4 inline-block">
                    <Button>Continue Wizard</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              units.map((unit) => (
                <Card key={unit.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <span className="text-muted-foreground mr-2">Unit {unit.ordinal + 1}</span>
                      {unit.title}
                    </CardTitle>
                  </CardHeader>
                  {unit.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{unit.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {lessons.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No lessons yet. Generate your course first.</p>
                </CardContent>
              </Card>
            ) : (
              lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'practice' && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">Practice sets will appear here after generation.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'assessments' && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">Assessments will appear here after generation.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'mastery' && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">Mastery tracking will appear here as learners engage.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'versions' && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">Course versions will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}