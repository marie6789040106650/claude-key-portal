/**
 * GET /api/monitor/metrics - 性能指标查询API
 *
 * 支持:
 * - 时间范围过滤 (from, to)
 * - 指标类型过滤 (type)
 * - 实时性能统计
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsCollectorService } from '@/lib/infrastructure/monitoring'
import { MetricType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type') as MetricType | null

    // 如果指定了时间范围和类型，返回原始数据
    if (from && to && type) {
      const metrics = await metricsCollectorService.getMetricsByTimeRange(
        type,
        new Date(from),
        new Date(to)
      )

      return NextResponse.json({ metrics }, { status: 200 })
    }

    // 否则返回聚合统计数据
    const [
      averageResponseTime,
      p95ResponseTime,
      qps,
      memoryTrend,
    ] = await Promise.all([
      metricsCollectorService.getAverageResponseTime(),
      metricsCollectorService.getP95ResponseTime(),
      metricsCollectorService.getQPS(),
      metricsCollectorService.getMemoryTrend(),
    ])

    return NextResponse.json(
      {
        averageResponseTime,
        p95ResponseTime,
        qps,
        memoryUsage: memoryTrend,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
