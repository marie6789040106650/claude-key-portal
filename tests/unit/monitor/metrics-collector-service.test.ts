/**
 * MetricsCollectorService 单元测试
 *
 * 测试性能指标收集服务的功能:
 * - API响应时间记录
 * - QPS统计
 * - 性能指标聚合
 * - 内存使用统计
 */

import { MetricsCollectorService } from '@/lib/services/metrics-collector-service'
import { prisma } from '@/lib/prisma'
import { MetricType } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    monitorMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('MetricsCollectorService', () => {
  let service: MetricsCollectorService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new MetricsCollectorService()
  })

  describe('响应时间记录', () => {
    it('应该记录API响应时间', async () => {
      const mockMetric = {
        id: 'metric-1',
        type: 'RESPONSE_TIME',
        name: '/api/keys',
        value: 150,
        unit: 'ms',
        timestamp: new Date(),
      }

      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue(mockMetric)

      const result = await service.recordResponseTime('/api/keys', 150)

      expect(result).toEqual(mockMetric)
      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'RESPONSE_TIME',
          name: '/api/keys',
          value: 150,
          unit: 'ms',
          timestamp: expect.any(Date),
        },
      })
    })

    it('应该支持自定义标签', async () => {
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue({})

      await service.recordResponseTime('/api/keys', 200, {
        method: 'POST',
        status: 201,
      })

      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: { method: 'POST', status: 201 },
        }),
      })
    })
  })

  describe('QPS统计', () => {
    it('应该统计最近1分钟的请求数', async () => {
      const now = new Date('2025-10-04T10:00:00.000Z')
      const oneMinuteAgo = new Date(now.getTime() - 60000)

      ;(prisma.monitorMetric.count as jest.Mock).mockResolvedValue(120)

      const result = await service.getQPS(now)

      expect(result).toBe(2) // 120 requests / 60 seconds = 2 QPS
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

    it('应该返回0当没有请求时', async () => {
      ;(prisma.monitorMetric.count as jest.Mock).mockResolvedValue(0)

      const result = await service.getQPS()

      expect(result).toBe(0)
    })
  })

  describe('性能指标聚合', () => {
    it('应该计算平均响应时间', async () => {
      const mockMetrics = [
        { value: 100 },
        { value: 200 },
        { value: 150 },
        { value: 250 },
      ]

      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      const result = await service.getAverageResponseTime('/api/keys')

      expect(result).toBe(175) // (100 + 200 + 150 + 250) / 4
    })

    it('应该计算P95响应时间', async () => {
      const mockMetrics = Array.from({ length: 100 }, (_, i) => ({
        value: (i + 1) * 10, // 10, 20, 30, ..., 1000
      }))

      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      const result = await service.getP95ResponseTime('/api/keys')

      expect(result).toBe(950) // 95th percentile
    })

    it('应该按时间范围聚合指标', async () => {
      const now = new Date('2025-10-04T10:00:00.000Z')
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue([])

      await service.getMetricsByTimeRange('RESPONSE_TIME', oneDayAgo, now)

      expect(prisma.monitorMetric.findMany).toHaveBeenCalledWith({
        where: {
          type: 'RESPONSE_TIME',
          timestamp: {
            gte: oneDayAgo,
            lte: now,
          },
        },
        orderBy: { timestamp: 'asc' },
      })
    })
  })

  describe('内存使用统计', () => {
    it('应该记录内存使用量', async () => {
      const memoryUsage = process.memoryUsage()

      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue({})

      await service.recordMemoryUsage()

      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'MEMORY_USAGE',
          name: 'heapUsed',
          value: memoryUsage.heapUsed,
          unit: 'bytes',
          timestamp: expect.any(Date),
          tags: expect.objectContaining({
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
          }),
        },
      })
    })

    it('应该计算内存使用趋势', async () => {
      const mockMetrics = [
        { value: 100_000_000, timestamp: new Date('2025-10-04T09:00:00') },
        { value: 120_000_000, timestamp: new Date('2025-10-04T09:30:00') },
        { value: 150_000_000, timestamp: new Date('2025-10-04T10:00:00') },
      ]

      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      const result = await service.getMemoryTrend()

      expect(result.trend).toBe('increasing')
      expect(result.percentageChange).toBeGreaterThan(0)
    })
  })

  describe('数据库查询性能', () => {
    it('应该记录数据库查询时间', async () => {
      ;(prisma.monitorMetric.create as jest.Mock).mockResolvedValue({})

      await service.recordDatabaseQuery('SELECT * FROM users', 25)

      expect(prisma.monitorMetric.create).toHaveBeenCalledWith({
        data: {
          type: 'DATABASE_QUERY',
          name: 'SELECT * FROM users',
          value: 25,
          unit: 'ms',
          timestamp: expect.any(Date),
        },
      })
    })
  })

  describe('边界条件', () => {
    it('应该处理空数据集', async () => {
      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue([])

      const result = await service.getAverageResponseTime('/api/nonexistent')

      expect(result).toBe(0)
    })

    it('应该处理异常值', async () => {
      const mockMetrics = [
        { value: 100 },
        { value: 150 },
        { value: 10000 }, // 异常值
        { value: 120 },
      ]

      ;(prisma.monitorMetric.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      )

      const result = await service.getAverageResponseTime('/api/keys', {
        excludeOutliers: true,
      })

      // 应该排除异常值后计算
      expect(result).toBeLessThan(200)
    })
  })
})
