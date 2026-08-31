/**
 * Where the public site lives.
 *
 * The marketing site is a separate static deployment now, so links back out of
 * the app are real cross-origin navigations rather than routes. Set
 * `NEXT_PUBLIC_SITE_URL` in production; the default is the site's dev port.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

export const siteHref = (path = '/') => `${SITE_URL}${path}`;
