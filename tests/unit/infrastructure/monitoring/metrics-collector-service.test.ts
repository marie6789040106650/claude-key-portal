/**
 * MetricsCollectorService 测试
 *
 * 测试场景：
 * - recordResponseTime: 记录API响应时间
 * - getQPS: 统计每秒请求数
 * - getAverageResponseTime: 计算平均响应时间
 * - getP95ResponseTime: 计算P95响应时间
 * - recordMemoryUsage: 记录内存使用量
 * - getMemoryTrend: 获取内存使用趋势
 * - recordDatabaseQuery: 记录数据库查询性能
 *
 * @jest-environment node
 */

import { MetricsCollectorService } from '@/lib/infrastructure/monitoring/metrics-collector-service'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { MetricType } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    monitorMetric: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('MetricsCollectorService', () => {
  let service: MetricsCollectorService

  beforeEach(() => {
    service = new MetricsCollectorService()
    jest.clearAllMocks()
  })

  describe('recordResponseTime', () => {
    it('should record response time successfully', async () => {
      // Arrange
      const endpoint = '/api/keys'
      const value = 123
      const tags = { method: 'GET', status: 200 }
      const mockMetric = {
        id: 'metric-1',
        type: 'RESPONSE_TIME' as MetricType,
        name: endpoint,
        value,
        unit: 'ms',
        tags,
        timestamp: new Date(),
      }
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue(mockMetric)

      // Act
      const result = await service.recordResponseTime(endpoint, value, tags)

      // Assert
      expect(result).toEqual(mockMetric)
      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'RESPONSE_TIME',
          name: endpoint,
          value,
          unit: 'ms',
          tags,
          timestamp: expect.any(Date),
        },
      })
    })

    it('should record response time without tags', async () => {
      // Arrange
      const endpoint = '/api/users'
      const value = 456
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue({})

      // Act
      await service.recordResponseTime(endpoint, value)

      // Assert
      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'RESPONSE_TIME',
          name: endpoint,
          value,
          unit: 'ms',
          tags: undefined,
          timestamp: expect.any(Date),
        },
      })
    })
  })

  describe('getQPS', () => {
    it('should calculate QPS correctly', async () => {
      // Arrange
      const now = new Date()
      ;(prisma.monitorMetric.count as jest.Mock).mockResolvedValue(120)

      // Act
      const qps = await service.getQPS(now)

      // Assert
      expect(qps).toBe(2) // 120 requests / 60 seconds
      expect(prisma.monitorMetric.count).toHaveBeenCalledWith({
        where: {
          type: 'RESPONSE_TIME',
          timestamp: {
            gte: expect.any(Date),
            lte: now,
          },
        },
      })
    })

    it('should use current time when now is not provided', async () => {
      // Arrange
      ;(prisma.monitorMetric.count as jest.Mock).mockResolvedValue(60)

      // Act
      const qps = await service.getQPS()

      // Assert
      expect(qps).toBe(1)
      expect(prisma.monitorMetric.count).toHaveBeenCalled()
    })
  })

  describe('getAverageResponseTime', () => {
    it('should calculate average response time for all endpoints', async () => {
      // Arrange
      const mockMetrics = [
        { value: 100 },
        { value: 200 },
        { value: 300 },
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const avg = await service.getAverageResponseTime()

      // Assert
      expect(avg).toBe(200)
      expect(prisma.monitorMetric.findMany).toHaveBeenCalledWith({
        where: { type: 'RESPONSE_TIME' },
        select: { value: true },
      })
    })

    it('should calculate average response time for specific endpoint', async () => {
      // Arrange
      const endpoint = '/api/keys'
      const mockMetrics = [{ value: 150 }, { value: 250 }]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const avg = await service.getAverageResponseTime(endpoint)

      // Assert
      expect(avg).toBe(200)
      expect(prisma.monitorMetric.findMany).toHaveBeenCalledWith({
        where: { type: 'RESPONSE_TIME', name: endpoint },
        select: { value: true },
      })
    })

    it('should return 0 when no metrics exist', async () => {
      // Arrange
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const avg = await service.getAverageResponseTime()

      // Assert
      expect(avg).toBe(0)
    })

    it('should exclude outliers when option is enabled', async () => {
      // Arrange
      const mockMetrics = [
        { value: 10 }, // Outlier
        { value: 100 },
        { value: 110 },
        { value: 120 },
        { value: 130 },
        { value: 1000 }, // Outlier
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const avg = await service.getAverageResponseTime(undefined, {
        excludeOutliers: true,
      })

      // Assert
      expect(avg).toBeGreaterThan(100)
      expect(avg).toBeLessThan(150)
    })
  })

  describe('getP95ResponseTime', () => {
    it('should calculate P95 response time correctly', async () => {
      // Arrange
      const mockMetrics = Array.from({ length: 100 }, (_, i) => ({
        value: i + 1,
      }))
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const p95 = await service.getP95ResponseTime()

      // Assert
      expect(p95).toBe(95)
    })

    it('should return 0 when no metrics exist', async () => {
      // Arrange
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const p95 = await service.getP95ResponseTime()

      // Assert
      expect(p95).toBe(0)
    })

    it('should calculate P95 for specific endpoint', async () => {
      // Arrange
      const endpoint = '/api/keys'
      const mockMetrics = [{ value: 100 }, { value: 200 }]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const p95 = await service.getP95ResponseTime(endpoint)

      // Assert
      expect(p95).toBeGreaterThan(0)
      expect(prisma.monitorMetric.findMany).toHaveBeenCalledWith({
        where: { type: 'RESPONSE_TIME', name: endpoint },
        select: { value: true },
      })
    })
  })

  describe('getMetricsByTimeRange', () => {
    it('should retrieve metrics within time range', async () => {
      // Arrange
      const from = new Date('2025-01-01')
      const to = new Date('2025-01-02')
      const mockMetrics = [
        { type: 'RESPONSE_TIME' as MetricType, value: 100 },
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const result = await service.getMetricsByTimeRange(
        'RESPONSE_TIME' as MetricType,
        from,
        to
      )

      // Assert
      expect(result).toEqual(mockMetrics)
      expect(prisma.monitorMetric.findMany).toHaveBeenCalledWith({
        where: {
          type: 'RESPONSE_TIME',
          timestamp: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { timestamp: 'asc' },
      })
    })
  })

  describe('recordMemoryUsage', () => {
    it('should record memory usage successfully', async () => {
      // Arrange
      const mockMetric = {
        id: 'metric-1',
        type: 'MEMORY_USAGE' as MetricType,
        name: 'heapUsed',
        value: 12345678,
        unit: 'bytes',
        timestamp: new Date(),
      }
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue(mockMetric)

      // Act
      const result = await service.recordMemoryUsage()

      // Assert
      expect(result).toEqual(mockMetric)
      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'MEMORY_USAGE',
          name: 'heapUsed',
          value: expect.any(Number),
          unit: 'bytes',
          timestamp: expect.any(Date),
          tags: {
            heapTotal: expect.any(Number),
            rss: expect.any(Number),
            external: expect.any(Number),
          },
        },
      })
    })
  })

  describe('getMemoryTrend', () => {
    it('should return stable trend when no metrics exist', async () => {
      // Arrange
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const trend = await service.getMemoryTrend()

      // Assert
      expect(trend.current).toBe(0)
      expect(trend.trend).toBe('stable')
      expect(trend.percentageChange).toBe(0)
    })

    it('should return stable trend when only one metric exists', async () => {
      // Arrange
      const mockMetrics = [{ value: 1000000 }]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const trend = await service.getMemoryTrend()

      // Assert
      expect(trend.current).toBe(1000000)
      expect(trend.trend).toBe('stable')
      expect(trend.percentageChange).toBe(0)
    })

    it('should detect increasing trend', async () => {
      // Arrange
      const mockMetrics = [
        { value: 2000000 }, // Current (newest)
        { value: 1500000 },
        { value: 1000000 }, // Previous (oldest)
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const trend = await service.getMemoryTrend()

      // Assert
      expect(trend.current).toBe(2000000)
      expect(trend.trend).toBe('increasing')
      expect(trend.percentageChange).toBeGreaterThan(5)
    })

    it('should detect decreasing trend', async () => {
      // Arrange
      const mockMetrics = [
        { value: 500000 }, // Current (newest)
        { value: 750000 },
        { value: 1000000 }, // Previous (oldest)
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const trend = await service.getMemoryTrend()

      // Assert
      expect(trend.current).toBe(500000)
      expect(trend.trend).toBe('decreasing')
      expect(trend.percentageChange).toBeLessThan(-5)
    })

    it('should detect stable trend with minor changes', async () => {
      // Arrange
      const mockMetrics = [
        { value: 1020000 }, // Current (+2%)
        { value: 1010000 },
        { value: 1000000 }, // Previous
      ]
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      // Act
      const trend = await service.getMemoryTrend()

      // Assert
      expect(trend.current).toBe(1020000)
      expect(trend.trend).toBe('stable')
      expect(trend.percentageChange).toBeLessThanOrEqual(5)
    })
  })

  describe('recordDatabaseQuery', () => {
    it('should record database query performance', async () => {
      // Arrange
      const query = 'SELECT * FROM users WHERE id = ?'
      const duration = 45
      const mockMetric = {
        id: 'metric-1',
        type: 'DATABASE_QUERY' as MetricType,
        name: query,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
      }
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue(mockMetric)

      // Act
      const result = await service.recordDatabaseQuery(query, duration)

      // Assert
      expect(result).toEqual(mockMetric)
      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'DATABASE_QUERY',
          name: query,
          value: duration,
          unit: 'ms',
          timestamp: expect.any(Date),
        },
      })
    })
  })
})
