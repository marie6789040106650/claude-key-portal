/**
 * GET /api/monitor/alerts - 告警记录查询API
 *
 * 支持:
 * - 状态过滤 (status)
 * - 严重程度过滤 (severity)
 * - 分页 (page, limit)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AlertStatus, AlertSeverity } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AlertStatus | null
    const severity = searchParams.get('severity') as AlertSeverity | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (severity) {
      where.rule = {
        severity,
      }
    }

    // 查询告警记录
    const [alerts, total] = await Promise.all([
      prisma.alertRecord.findMany({
        where,
        include: {
          rule: {
            select: {
              name: true,
              severity: true,
              metric: true,
            },
          },
        },
        orderBy: { triggeredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.alertRecord.count({ where }),
    ])

    return NextResponse.json(
      {
        alerts,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
