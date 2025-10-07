/**
 * HealthCheckService 单元测试
 *
 * 测试系统健康检查服务的功能:
 * - 数据库连接检查
 * - Redis连接检查
 * - CRS服务检查
 * - 整体健康状态聚合
 */

import { HealthCheckService } from '@/lib/services/health-check-service'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { redis } from '@/lib/infrastructure/cache/redis'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    systemHealth: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    ping: jest.fn(),
  },
}))

jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    healthCheck: jest.fn(),
  },
}))

describe('HealthCheckService', () => {
  let service: HealthCheckService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new HealthCheckService()
  })

  describe('数据库健康检查', () => {
    it('应该成功检查数据库连接', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

      const result = await service.checkDatabase()

      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(prisma.$queryRaw).toHaveBeenCalled()
    })

    it('应该检测数据库连接失败', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      )

      const result = await service.checkDatabase()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Connection failed')
    })

    it('应该记录数据库响应时间', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([{ result: 1 }]), 50)
          })
      )

      const result = await service.checkDatabase()

      expect(result.responseTime).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Redis健康检查', () => {
    it('应该成功检查Redis连接', async () => {
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      const result = await service.checkRedis()

      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(redis.ping).toHaveBeenCalled()
    })

    it('应该检测Redis连接失败', async () => {
      ;(redis.ping as jest.Mock).mockRejectedValue(
        new Error('Redis unavailable')
      )

      const result = await service.checkRedis()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Redis unavailable')
    })
  })

  describe('CRS服务健康检查', () => {
    it('应该成功检查CRS服务', async () => {
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue({
        status: 'ok',
      })

      const result = await service.checkCRS()

      expect(result.status).toBe('healthy')
      expect(crsClient.healthCheck).toHaveBeenCalled()
    })

    it('应该检测CRS服务不可用', async () => {
      ;(crsClient.healthCheck as jest.Mock).mockRejectedValue(
        new Error('CRS timeout')
      )

      const result = await service.checkCRS()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('CRS timeout')
    })
  })

  describe('整体健康状态', () => {
    it('应该返回所有服务健康状态', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue({ status: 'ok' })

      const result = await service.checkAll()

      expect(result.overall).toBe('healthy')
      expect(result.services).toHaveProperty('database')
      expect(result.services).toHaveProperty('redis')
      expect(result.services).toHaveProperty('crs')
      expect(result.services.database.status).toBe('healthy')
      expect(result.services.redis.status).toBe('healthy')
      expect(result.services.crs.status).toBe('healthy')
    })

    it('应该在任一服务失败时标记整体为不健康', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])
      ;(redis.ping as jest.Mock).mockRejectedValue(new Error('Redis down'))
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue({ status: 'ok' })

      const result = await service.checkAll()

      expect(result.overall).toBe('degraded')
      expect(result.services.redis.status).toBe('unhealthy')
    })
  })
})
