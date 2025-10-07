/**
 * Dashboard API
 * GET /api/dashboard - 获取用户仪表板数据
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/dashboard - 获取仪表板数据
 */
export async function GET(request: Request) {
  try {
    // 1. 验证JWT Token
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url)
    const includeCrsStats = searchParams.get('includeCrsStats') === 'true'

    // 3. 获取用户密钥总数
    const totalKeys = await prisma.apiKey.count({
      where: { userId },
    })

    // 4. 获取用户所有密钥信息（用于聚合统计）
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        totalTokens: true,
        totalCalls: true,
      },
    })

    // 5. 聚合统计数据
    const overview = {
      totalKeys,
      activeKeys: keys.filter((k) => k.status === 'ACTIVE').length,
      inactiveKeys: keys.filter((k) => k.status === 'INACTIVE').length,
      totalTokensUsed: keys.reduce((sum, k) => sum + Number(k.totalTokens || 0), 0),
      totalRequests: keys.reduce((sum, k) => sum + Number(k.totalCalls || 0), 0),
    }

    // 6. 获取最近使用的密钥
    const recentActivity = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        totalCalls: true,
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 5,
    })

    // 7. 构建响应
    const response: any = {
      overview,
      recentActivity,
    }

    // 8. 可选：从CRS获取全局统计
    if (includeCrsStats) {
      try {
        const crsData = await crsClient.getDashboard()
        response.crsStats = crsData
      } catch (error) {
        response.crsStatsError = 'CRS统计数据暂时不可用'
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
