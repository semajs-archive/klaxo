import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The AI + DB layers are server-only. Never bundle secrets into the client.
  serverExternalPackages: ['node:sqlite', 'pdfjs-dist'],
  experimental: {
    // Generation jobs can outlive a single request handler tick.
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default nextConfig;
