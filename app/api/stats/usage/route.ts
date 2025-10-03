/**
 * Usage Stats API
 * GET /api/stats/usage - 获取使用统计数据
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crsClient } from '@/lib/crs-client'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/stats/usage - 获取使用统计
 *
 * 查询参数:
 * - keyId: 获取单个密钥统计（可选）
 * - realtime: 是否从CRS获取实时统计（可选）
 * - startDate: 开始日期（可选）
 * - endDate: 结束日期（可选）
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
    const keyId = searchParams.get('keyId')
    const realtime = searchParams.get('realtime') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 3. 如果指定了keyId，返回单个密钥统计
    if (keyId) {
      return await getSingleKeyStats(userId, keyId, realtime)
    }

    // 4. 否则返回所有密钥的聚合统计
    return await getAllKeysStats(userId, startDate, endDate)
  } catch (error: any) {
    console.error('Usage stats error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * 获取单个密钥统计
 */
async function getSingleKeyStats(
  userId: string,
  keyId: string,
  realtime: boolean
) {
  // 1. 查询密钥信息
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    select: {
      id: true,
      userId: true,
      name: true,
      keyValue: true,
      status: true,
      totalTokens: true,
      totalRequests: true,
      monthlyUsage: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })

  // 2. 检查密钥是否存在
  if (!key) {
    return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
  }

  // 3. 检查权限
  if (key.userId !== userId) {
    return NextResponse.json({ error: '无权访问此密钥' }, { status: 403 })
  }

  // 4. 构建响应
  const response: any = {
    key: {
      id: key.id,
      name: key.name,
      status: key.status,
      totalTokens: key.totalTokens,
      totalRequests: key.totalRequests,
      monthlyUsage: key.monthlyUsage,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    },
  }

  // 5. 可选：从CRS获取实时统计
  if (realtime && key.keyValue) {
    try {
      const realtimeStats = await crsClient.getKeyStats(key.keyValue)
      response.key.realtimeStats = realtimeStats
    } catch (error) {
      response.crsWarning = '实时统计暂时不可用，显示缓存数据'
    }
  }

  return NextResponse.json(response)
}

/**
 * 获取所有密钥的聚合统计
 */
async function getAllKeysStats(
  userId: string,
  startDate: string | null,
  endDate: string | null
) {
  // 1. 构建查询条件
  const where: any = {
    userId,
  }

  // 2. 添加时间范围过滤
  if (startDate || endDate) {
    where.createdAt = {}

    if (startDate) {
      const start = new Date(startDate)
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: '时间范围参数格式不正确' },
          { status: 400 }
        )
      }
      where.createdAt.gte = start
    }

    if (endDate) {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: '时间范围参数格式不正确' },
          { status: 400 }
        )
      }
      where.createdAt.lte = end
    }
  }

  // 3. 查询所有密钥
  const keys = await prisma.apiKey.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
      totalTokens: true,
      totalRequests: true,
      monthlyUsage: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })

  // 4. 聚合统计
  const totalTokens = keys.reduce((sum, k) => sum + (k.totalTokens || 0), 0)
  const totalRequests = keys.reduce((sum, k) => sum + (k.totalRequests || 0), 0)

  const summary = {
    totalTokens,
    totalRequests,
    averageTokensPerRequest:
      totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    keyCount: keys.length,
  }

  return NextResponse.json({
    summary,
    keys,
  })
}
