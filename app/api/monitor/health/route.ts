/**
 * GET /api/monitor/health - 健康检查API
 *
 * 返回系统各组件的健康状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { healthCheckService } from '@/lib/infrastructure/monitoring'

export async function GET(request: NextRequest) {
  try {
    const result = await healthCheckService.checkAll()

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
