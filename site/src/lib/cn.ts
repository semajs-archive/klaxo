import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Where the product lives. The site is a static export and the app is a
 * separate deployment, so every "sign in" and "start" link points here.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3101';

export const appHref = (path = '/') => `${APP_URL}${path}`;
