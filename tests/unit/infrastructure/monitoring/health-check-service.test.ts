/**
 * HealthCheckService 测试
 *
 * 测试场景：
 * - checkDatabase: 数据库连接检查
 * - checkRedis: Redis连接检查
 * - checkCRS: CRS服务检查
 * - checkAll: 所有服务健康检查和聚合
 * - saveHealthCheck: 保存健康检查结果
 *
 * @jest-environment node
 */

import { HealthCheckService } from '@/lib/infrastructure/monitoring/health-check-service'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { redis } from '@/lib/infrastructure/cache/redis'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    systemHealth: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/infrastructure/cache/redis', () => ({
  redis: {
    ping: jest.fn(),
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    healthCheck: jest.fn(),
  },
}))

describe('HealthCheckService', () => {
  let service: HealthCheckService

  beforeEach(() => {
    service = new HealthCheckService()
    jest.clearAllMocks()
  })

  describe('checkDatabase', () => {
    it('should return healthy status when database is connected', async () => {
      // Arrange
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

      // Act
      const result = await service.checkDatabase()

      // Assert
      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeUndefined()
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
    })

    it('should return unhealthy status when database connection fails', async () => {
      // Arrange
      const error = new Error('Connection refused')
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(error)

      // Act
      const result = await service.checkDatabase()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBe('Connection refused')
    })
  })

  describe('checkRedis', () => {
    it('should return healthy status when Redis responds with PONG', async () => {
      // Arrange
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      // Act
      const result = await service.checkRedis()

      // Assert
      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeUndefined()
      expect(redis.ping).toHaveBeenCalledTimes(1)
    })

    it('should return unhealthy status when Redis responds unexpectedly', async () => {
      // Arrange
      ;(redis.ping as jest.Mock).mockResolvedValue('UNEXPECTED')

      // Act
      const result = await service.checkRedis()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBe('Unexpected response from Redis')
    })

    it('should return unhealthy status when Redis connection fails', async () => {
      // Arrange
      const error = new Error('Redis connection timeout')
      ;(redis.ping as jest.Mock).mockRejectedValue(error)

      // Act
      const result = await service.checkRedis()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBe('Redis connection timeout')
    })
  })

  describe('checkCRS', () => {
    it('should return healthy status when CRS is accessible', async () => {
      // Arrange
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue(true)

      // Act
      const result = await service.checkCRS()

      // Assert
      expect(result.status).toBe('healthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeUndefined()
      expect(crsClient.healthCheck).toHaveBeenCalledTimes(1)
    })

    it('should return unhealthy status when CRS is not accessible', async () => {
      // Arrange
      const error = new Error('CRS service unavailable')
      ;(crsClient.healthCheck as jest.Mock).mockRejectedValue(error)

      // Act
      const result = await service.checkCRS()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.error).toBe('CRS service unavailable')
    })
  })

  describe('checkAll', () => {
    it('should return overall healthy when all services are healthy', async () => {
      // Arrange
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue(true)
      ;(prisma.systemHealth.create as jest.Mock).mockResolvedValue({})

      // Act
      const result = await service.checkAll()

      // Assert
      expect(result.overall).toBe('healthy')
      expect(result.services.database.status).toBe('healthy')
      expect(result.services.redis.status).toBe('healthy')
      expect(result.services.crs.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
      expect(prisma.systemHealth.create).toHaveBeenCalledTimes(1)
    })

    it('should return overall degraded when 1-2 services are unhealthy', async () => {
      // Arrange
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])
      ;(redis.ping as jest.Mock).mockRejectedValue(new Error('Redis error'))
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue(true)
      ;(prisma.systemHealth.create as jest.Mock).mockResolvedValue({})

      // Act
      const result = await service.checkAll()

      // Assert
      expect(result.overall).toBe('degraded')
      expect(result.services.database.status).toBe('healthy')
      expect(result.services.redis.status).toBe('unhealthy')
      expect(result.services.crs.status).toBe('healthy')
    })

    it('should return overall unhealthy when all services are unhealthy', async () => {
      // Arrange
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('DB error')
      )
      ;(redis.ping as jest.Mock).mockRejectedValue(new Error('Redis error'))
      ;(crsClient.healthCheck as jest.Mock).mockRejectedValue(
        new Error('CRS error')
      )
      ;(prisma.systemHealth.create as jest.Mock).mockRejectedValue(
        new Error('Save failed')
      )

      // Act
      const result = await service.checkAll()

      // Assert
      expect(result.overall).toBe('unhealthy')
      expect(result.services.database.status).toBe('unhealthy')
      expect(result.services.redis.status).toBe('unhealthy')
      expect(result.services.crs.status).toBe('unhealthy')
    })

    it('should not throw when saving health check fails', async () => {
      // Arrange
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')
      ;(crsClient.healthCheck as jest.Mock).mockResolvedValue(true)
      ;(prisma.systemHealth.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      // Act & Assert
      await expect(service.checkAll()).resolves.toBeDefined()
    })
  })
})
