/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['open.feishu.cn'],
  },
  env: {
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_APP_SECRET: process.env.NEXT_PUBLIC_APP_SECRET,
    NEXT_PUBLIC_APP_TOKEN: process.env.NEXT_PUBLIC_APP_TOKEN,
    NEXT_PUBLIC_SUMMARY_TABLE_ID: process.env.NEXT_PUBLIC_SUMMARY_TABLE_ID,
    NEXT_PUBLIC_SUMMARY_VIEW_ID: process.env.NEXT_PUBLIC_SUMMARY_VIEW_ID,
    NEXT_PUBLIC_NEWS_TABLE_ID: process.env.NEXT_PUBLIC_NEWS_TABLE_ID,
    NEXT_PUBLIC_NEWS_VIEW_ID: process.env.NEXT_PUBLIC_NEWS_VIEW_ID,
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