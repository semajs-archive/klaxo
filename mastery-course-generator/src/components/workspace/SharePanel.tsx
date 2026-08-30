'use client';

/**
 * Owner-side sharing controls: create/copy/turn off the invite link and see
 * who has joined with their mastery progress.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface ShareStudent {
  userId: string;
  name: string;
  joinedAt: number;
  mastered: number;
  objectiveCount: number;
}

interface ShareData {
  share: { token: string; createdAt: number } | null;
  students: ShareStudent[];
}

export default function SharePanel({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ShareData | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/courses/${courseId}/share`)
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(body.error ?? 'Could not load sharing info.');
        setData(body as ShareData);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load sharing info.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  const mutate = useCallback(
    async (method: 'POST' | 'DELETE') => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${courseId}/share`, { method });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
        setData(body as ShareData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    },
    [courseId],
  );

  const link =
    data?.share && typeof window !== 'undefined'
      ? `${window.location.origin}/learn/${data.share.token}`
      : null;

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 h-4 w-4" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" />
        </svg>
        Share
      </Button>

      {open && (
        <Card className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,26rem)]">
          <CardContent className="p-5">
            <h3 className="font-display text-lg font-bold">Invite students</h3>
            {!data && !error && (
              <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
            )}
            {error && (
              <p className="mt-2 text-sm text-error" role="alert">
                {error}
              </p>
            )}

            {data && !data.share && (
              <>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Create a link anyone can open to join this course. They type
                  their name and start learning — no account needed.
                </p>
                <Button className="mt-4 w-full" loading={busy} onClick={() => void mutate('POST')}>
                  Create invite link
                </Button>
              </>
            )}

            {data?.share && link && (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-10 w-full min-w-0 flex-1 rounded-lg border-[1.5px] border-input bg-secondary px-3 font-mono text-xs"
                    aria-label="Invite link"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className={cn(copied && 'bg-brand-300')}
                    onClick={async () => {
                      await navigator.clipboard.writeText(link);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="mt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Joined · {data.students.length}
                  </p>
                  {data.students.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No one yet — send the link to your students.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {data.students.map((s) => (
                        <li key={s.userId} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                          <span className="text-sm font-semibold">{s.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {s.mastered}/{s.objectiveCount} mastered
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  className="mt-4 text-xs font-semibold text-error hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void mutate('DELETE')}
                >
                  Turn off this link
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
