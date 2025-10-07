/**
 * MetricsCollectorService - 性能指标收集服务
 *
 * 负责收集和聚合系统性能指标:
 * - API响应时间记录
 * - QPS统计
 * - 性能指标聚合
 * - 内存使用统计
 */

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { MetricType } from '@prisma/client'

export interface RecordOptions {
  tags?: Record<string, any>
}

export interface AggregationOptions {
  excludeOutliers?: boolean
}

export interface MemoryTrend {
  current: number
  trend: 'increasing' | 'decreasing' | 'stable'
  percentageChange: number
}

export class MetricsCollectorService {
  /**
   * 记录API响应时间
   */
  async recordResponseTime(
    endpoint: string,
    value: number,
    tags?: Record<string, any>
  ) {
    return await prisma.monitorMetric.create({
      data: {
        type: 'RESPONSE_TIME',
        name: endpoint,
        value,
        unit: 'ms',
        tags,
        timestamp: new Date(),
      },
    })
  }

  /**
   * 统计QPS (每分钟请求数)
   */
  async getQPS(now?: Date): Promise<number> {
    const currentTime = now || new Date()
    const oneMinuteAgo = new Date(currentTime.getTime() - 60000)

    const count = await prisma.monitorMetric.count({
      where: {
        type: 'RESPONSE_TIME',
        timestamp: {
          gte: oneMinuteAgo,
          lte: currentTime,
        },
      },
    })

    return count / 60 // 转换为每秒请求数
  }

  /**
   * 计算平均响应时间
   */
  async getAverageResponseTime(
    endpoint?: string,
    options?: AggregationOptions
  ): Promise<number> {
    const where: any = { type: 'RESPONSE_TIME' }
    if (endpoint) {
      where.name = endpoint
    }

    const metrics = await prisma.monitorMetric.findMany({
      where,
      select: { value: true },
    })

    if (metrics.length === 0) return 0

    let values = metrics.map((m) => m.value)

    // 排除异常值 (使用IQR方法)
    if (options?.excludeOutliers && values.length > 4) {
      values.sort((a, b) => a - b)
      const q1Index = Math.floor(values.length * 0.25)
      const q3Index = Math.floor(values.length * 0.75)
      const q1 = values[q1Index]
      const q3 = values[q3Index]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr

      values = values.filter((v) => v >= lowerBound && v <= upperBound)
    }

    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }

  /**
   * 计算P95响应时间
   */
  async getP95ResponseTime(endpoint?: string): Promise<number> {
    const where: any = { type: 'RESPONSE_TIME' }
    if (endpoint) {
      where.name = endpoint
    }

    const metrics = await prisma.monitorMetric.findMany({
      where,
      select: { value: true },
    })

    if (metrics.length === 0) return 0

    const values = metrics.map((m) => m.value).sort((a, b) => a - b)
    const p95Index = Math.ceil(values.length * 0.95) - 1

    return values[p95Index] || 0
  }

  /**
   * 按时间范围查询指标
   */
  async getMetricsByTimeRange(
    type: MetricType,
    from: Date,
    to: Date
  ) {
    return await prisma.monitorMetric.findMany({
      where: {
        type,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * 记录内存使用量
   */
  async recordMemoryUsage() {
    const memoryUsage = process.memoryUsage()

    return await prisma.monitorMetric.create({
      data: {
        type: 'MEMORY_USAGE',
        name: 'heapUsed',
        value: memoryUsage.heapUsed,
        unit: 'bytes',
        timestamp: new Date(),
        tags: {
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external,
        },
      },
    })
  }

  /**
   * 获取内存使用趋势
   */
  async getMemoryTrend(): Promise<MemoryTrend> {
    const metrics = await prisma.monitorMetric.findMany({
      where: {
        type: 'MEMORY_USAGE',
        name: 'heapUsed',
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    if (metrics.length < 2) {
      return {
        current: metrics[0]?.value || 0,
        trend: 'stable',
        percentageChange: 0,
      }
    }

    const current = metrics[0].value
    const previous = metrics[metrics.length - 1].value
    const percentageChange = ((current - previous) / previous) * 100

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (percentageChange > 5) {
      trend = 'increasing'
    } else if (percentageChange < -5) {
      trend = 'decreasing'
    } else {
      trend = 'stable'
    }

    return {
      current,
      trend,
      percentageChange,
    }
  }

  /**
   * 记录数据库查询性能
   */
  async recordDatabaseQuery(query: string, duration: number) {
    return await prisma.monitorMetric.create({
      data: {
        type: 'DATABASE_QUERY',
        name: query,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
      },
    })
  }
}
