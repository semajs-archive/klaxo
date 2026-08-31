/**
 * The site's pages, in nav order.
 *
 * Kept out of the header component on purpose: the header is a client
 * component, and importing a plain value across that boundary hands a server
 * component a client reference rather than the array itself.
 */
export const NAV = [
  { href: '/how-it-builds', label: 'How it builds' },
  { href: '/what-you-get', label: 'What you get' },
  { href: '/students', label: 'Students' },
  { href: '/what-it-costs', label: 'What it costs' },
] as const;
