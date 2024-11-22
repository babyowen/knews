/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://open.feishu.cn https://api.moonshot.cn",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self' https://open.feishu.cn https://api.moonshot.cn",
              "media-src 'self' blob:",
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ],
      }
    ];
  }
};

module.exports = nextConfig; 