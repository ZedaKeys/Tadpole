import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/phone',
  images: {
    unoptimized: true, // Static export / PWA friendly
  },
};

export default nextConfig;
