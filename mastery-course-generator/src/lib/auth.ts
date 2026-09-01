/**
 * Session handling.
 *
 * Deliberately minimal: an HMAC-signed, httpOnly session cookie carrying a
 * user id. There is no password store and no third-party identity provider,
 * because the product requirement is *ownership isolation* (a user may only
 * read and mutate their own courses), not federated identity.
 *
 * The signature prevents a client from forging another user's id, which is the
 * property the authorization checks depend on.
 */
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { getEnv } from './env';
import { unauthorized } from './errors';
import { getSoloUserId } from './solo';

const COOKIE = 'mcg_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(payload: string): string {
  return createHmac('sha256', getEnv().APP_SECRET).update(payload).digest('base64url');
}

/** `<userId>.<issuedAt>.<signature>` */
export function encodeSession(userId: string, issuedAt = Date.now()): string {
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, issuedAt, signature] = parts as [string, string, string];
  if (!userId || !issuedAt || !signature) return null;

  const expected = sign(`${userId}.${issuedAt}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SECONDS * 1000) return null;

  return { userId };
}

export const SESSION_COOKIE = COOKIE;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: getEnv().NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

/**
 * Who this request belongs to.
 *
 * This is a single-person app, so there is no sign-in and the answer is always
 * the solo user. The signature is kept — and every route still authorises
 * through it — so ownership checks stay exactly as they were and the app could
 * be opened up again without touching the API.
 */
export async function readSession(): Promise<{ userId: string } | null> {
  return { userId: getSoloUserId() };
}

export async function requireUserId(): Promise<string> {
  const session = await readSession();
  if (!session) throw unauthorized();
  return session.userId;
}

export function newUserId(): string {
  return `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
}
