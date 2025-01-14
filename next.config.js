/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['open.feishu.cn'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://nls-gateway-cn-shanghai.aliyuncs.com wss://nls-gateway-cn-shanghai.aliyuncs.com https://nls-meta.cn-shanghai.aliyuncs.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self'",
              "media-src 'self' blob:",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 