import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Where the product lives. The site is a static export and the app is a
 * separate deployment, so every link into the product points here.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3101';

export const appHref = (path = '/') => `${APP_URL}${path}`;

/**
 * The front door. The app has no sign-in at all — it opens straight onto your
 * own material — so every button here just points at the app.
 */
export const START_HREF = appHref('/');
