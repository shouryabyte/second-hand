/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    if (!apiOrigin) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;