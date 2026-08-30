'use client';

/**
 * Share-link landing page. A learner opens the link, types their name, and
 * is dropped into the course workspace — no account needed.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface ShareInfo {
  course: {
    id: string;
    title: string;
    description: string | null;
    subjectDomain: string | null;
    targetLevel: string | null;
  };
  joined: boolean;
  isOwner: boolean;
  displayName: string | null;
}

export default function LearnJoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/learn/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? 'This invite link is no longer active.');
        setInfo(data as ShareInfo);
        if (data.displayName) setName(data.displayName);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const join = useCallback(async () => {
    if (!info) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/learn/${token}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not join this course.');
      router.push(`/workspace/${data.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join this course.');
      setJoining(false);
    }
  }, [info, name, router, token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card className="py-10 text-center">
          <CardContent>
            <h1 className="font-display text-xl font-bold">Link not active</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="mx-auto max-w-md pt-8 sm:pt-14">
      <Card>
        <CardContent className="p-7 sm:p-8">
          <p className="kicker">You&rsquo;re invited to</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">
            {info.course.title}
          </h1>
          {info.course.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {info.course.description}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {info.course.subjectDomain && (
              <span className="badge border-border bg-secondary">{info.course.subjectDomain}</span>
            )}
            {info.course.targetLevel && (
              <span className="badge border-border bg-secondary">{info.course.targetLevel}</span>
            )}
          </div>

          {info.joined ? (
            <Button className="mt-7 w-full" size="lg" onClick={() => router.push(`/workspace/${info.course.id}`)}>
              {info.isOwner ? 'Open your course' : 'Keep learning'}
            </Button>
          ) : (
            <>
              <div className="mt-7">
                <Input
                  label="Your name"
                  placeholder="e.g., Jordan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) void join();
                  }}
                />
              </div>
              {error && (
                <p className="mt-3 text-sm text-error" role="alert">
                  {error}
                </p>
              )}
              <Button
                className="mt-4 w-full"
                size="lg"
                variant="secondary"
                loading={joining}
                disabled={!name.trim()}
                onClick={() => void join()}
              >
                Start learning
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Your practice and progress are saved under your name on this device.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
