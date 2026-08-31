import { redirect } from 'next/navigation';

/**
 * There is nothing to sign into and nothing to sell here, so the root goes
 * straight to the thing this app is for: revising.
 */
export default function RootPage() {
  redirect('/study');
}
