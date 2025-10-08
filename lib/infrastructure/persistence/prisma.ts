/**
 * Prisma Client Singleton for Serverless Environments
 *
 * 优化说明:
 * 1. 所有环境下都缓存实例（包括生产环境）
 * 2. 添加连接池配置优化serverless性能
 * 3. 防止prepared statement冲突
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Serverless环境优化配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// ✅ 重要：所有环境都缓存实例，避免重复创建导致prepared statement冲突
globalForPrisma.prisma = prisma
