import type { NextConfig } from 'next';

/**
 * The marketing site is a plain static export: no server, no database, no API.
 * `out/` drops onto any static host, which is how the client sites are shipped.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
