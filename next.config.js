/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注意：Vercel部署不需要 'standalone' 模式
  // 如需Docker部署，请取消注释下行
  // output: 'standalone',

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    // Vercel自动优化，无需额外配置
  },

  // 环境变量（开发时可用，生产环境在Vercel控制台配置）
  env: {
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  },
}

module.exports = nextConfig
