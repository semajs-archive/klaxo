import { redirect } from 'next/navigation';

/**
 * The app has no front page of its own any more — the public site is a
 * separate deployment. Anyone landing on the root is here to work, so send
 * them to their courses; middleware bounces them to sign-in if they are not
 * signed in yet.
 */
export default function RootPage() {
  redirect('/dashboard');
}
