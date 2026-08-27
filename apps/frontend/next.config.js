/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  eslint: {
    // Linting runs as its own workspace task (`pnpm lint`).
    ignoreDuringBuilds: true,
  },
  /**
   * The browser never talks to the API host directly — it calls same-origin
   * `/api/...` and Next proxies to the backend. This keeps cookies first-party
   * and works unchanged behind the sandbox preview proxy.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
