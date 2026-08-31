'use client';

/**
 * Account — the second half of the phone's bottom bar.
 *
 * It is deliberately thin: who you are signed in as, and the one action that
 * belongs to that (sign out). A guest gets the sentence that actually matters
 * to them — the courses are in this browser and nowhere else — and the way to
 * fix it.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface Me {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isGuest: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMe(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-bold">Account</h1>

      {me === undefined && (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      )}

      {me === null && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="font-serif text-[15px] leading-7 text-foreground-soft">
              You are signed out.
            </p>
            <Link href="/login" className="mt-5 block">
              <Button className="min-h-11 w-full" size="lg">
                Sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {me && me.isGuest && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Guest
            </p>
            <p className="mt-2 font-serif text-[15px] leading-7 text-foreground-soft">
              You have not made an account. Your courses live in this browser only — clear its
              data, or open KLAXO on another device, and they are not there. Make an account and
              everything you have built comes with you.
            </p>
            <Link href="/login?mode=signup" className="mt-5 block">
              <Button className="min-h-11 w-full" size="lg">
                Create an account
              </Button>
            </Link>
            <Button
              variant="outline"
              className="mt-3 min-h-11 w-full"
              size="lg"
              loading={busy}
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      )}

      {me && !me.isGuest && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-1 break-words font-display text-lg font-bold">{me.email}</p>
            {me.displayName && (
              <p className="mt-1 text-sm text-muted-foreground">{me.displayName}</p>
            )}
            <Button
              variant="outline"
              className="mt-6 min-h-11 w-full"
              size="lg"
              loading={busy}
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
