/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_APP_SECRET: process.env.NEXT_PUBLIC_APP_SECRET,
    NEXT_PUBLIC_APP_TOKEN: process.env.NEXT_PUBLIC_APP_TOKEN,
    NEXT_PUBLIC_TABLE_ID: process.env.NEXT_PUBLIC_TABLE_ID,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
          }
        ],
      }
    ];
  }
};

module.exports = nextConfig; 