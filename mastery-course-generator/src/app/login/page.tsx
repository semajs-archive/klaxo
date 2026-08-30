'use client';

/** Sign in / create account — one page, two modes. */
import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

/** Only send people to in-app paths, never to an attacker-supplied URL. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    search.get('mode') === 'signup' ? 'signup' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);
  const next = safeNext(search.get('next'));

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? { email, password, displayName: displayName.trim() || undefined }
            : { email, password },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }, [mode, email, password, displayName, router, next]);

  /** Kept from the original build: try the app without making an account. */
  const continueAsGuest = useCallback(async () => {
    setGuestBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/bootstrap', { method: 'POST' });
      if (!res.ok) throw new Error('Could not start a guest session.');
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setGuestBusy(false);
    }
  }, [router, next]);

  const canSubmit = email.trim() !== '' && password !== '' && !busy;

  return (
    <div className="mx-auto max-w-md pt-8 sm:pt-14">
      <Card>
        <CardContent className="p-7 sm:p-8">
          <p className="kicker">{mode === 'login' ? 'Welcome back' : 'Get started'}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            {mode === 'login' ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Pick up your courses where you left them.'
              : 'Your account keeps your courses safe across devices. Anything you built as a guest comes with you.'}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) void submit();
            }}
          >
            {mode === 'signup' && (
              <Input
                label="Name"
                placeholder="What students should call you"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!canSubmit}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <button
            type="button"
            className="mt-5 w-full text-center text-sm font-semibold text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
          >
            {mode === 'login'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="mt-6 w-full"
            size="lg"
            loading={guestBusy}
            onClick={() => void continueAsGuest()}
          >
            Look around without an account
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            Guest courses live in this browser only. Create an account later and they come with you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
