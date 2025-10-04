/**
 * GET /api/monitor/health - 健康检查API
 *
 * 返回系统各组件的健康状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { HealthCheckService } from '@/lib/services/health-check-service'

export async function GET(request: NextRequest) {
  try {
    const healthCheck = new HealthCheckService()
    const result = await healthCheck.checkAll()

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
