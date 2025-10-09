/**
 * Leaderboard Stats API
 * GET /api/stats/leaderboard - 获取密钥使用量Top 10排行榜
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * 排序维度类型
 */
type SortBy = 'tokens' | 'requests' | 'cost'

/**
 * 排行榜项目接口
 */
interface LeaderboardItem {
  id: string
  name: string
  rank: number
  totalTokens: number
  totalRequests: number
  cost: number
  percentage: number
  status: string
  createdAt: Date
  lastUsedAt: Date | null
}

/**
 * 响应接口
 */
interface LeaderboardResponse {
  leaderboard: LeaderboardItem[]
  metadata: {
    totalKeys: number
    displayedKeys: number
  }
}

/**
 * 工具函数：安全地将 BigInt 转换为 Number
 */
function bigIntToNumber(value: bigint | null | undefined): number {
  return value ? Number(value) : 0
}

/**
 * 工具函数：计算成本（基于 token 数）
 * 假设成本计算公式: cost = totalTokens / 100000
 */
function calculateCost(totalTokens: number): number {
  return Number((totalTokens / 100000).toFixed(4))
}

/**
 * 工具函数：计算相对百分比
 */
function calculatePercentage(value: number, maxValue: number): number {
  if (maxValue === 0) return 0
  return Math.round((value / maxValue) * 100)
}

/**
 * 工具函数：根据排序维度获取排序值
 */
function getSortValue(
  item: {
    totalTokens: number
    totalRequests: number
    cost: number
  },
  sortBy: SortBy
): number {
  switch (sortBy) {
    case 'requests':
      return item.totalRequests
    case 'cost':
      return item.cost
    case 'tokens':
    default:
      return item.totalTokens
  }
}

/**
 * GET /api/stats/leaderboard - 获取排行榜
 *
 * 查询参数:
 * - sortBy: 排序维度 (tokens|requests|cost)，默认为 tokens
 */
export async function GET(request: Request) {
  try {
    // 1. 验证 JWT Token
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
    const sortByParam = searchParams.get('sortBy') || 'tokens'

    // 3. 验证 sortBy 参数
    const validSortByValues: SortBy[] = ['tokens', 'requests', 'cost']
    if (!validSortByValues.includes(sortByParam as SortBy)) {
      return NextResponse.json(
        { error: 'sortBy 参数必须是 tokens、requests 或 cost 之一' },
        { status: 400 }
      )
    }

    const sortBy = sortByParam as SortBy

    // 4. 查询当前用户的所有密钥
    const keys = await prisma.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalTokens: true,
        totalCalls: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })

    // 5. 转换数据并计算成本
    const keysWithStats = keys.map(k => ({
      id: k.id,
      name: k.name,
      status: k.status,
      totalTokens: bigIntToNumber(k.totalTokens),
      totalRequests: bigIntToNumber(k.totalCalls),
      cost: calculateCost(bigIntToNumber(k.totalTokens)),
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }))

    // 6. 按指定维度排序
    const sortedKeys = [...keysWithStats].sort((a, b) => {
      const aValue = getSortValue(a, sortBy)
      const bValue = getSortValue(b, sortBy)
      return bValue - aValue // 降序排序
    })

    // 7. 取 Top 10
    const top10Keys = sortedKeys.slice(0, 10)

    // 8. 计算最大值（用于百分比计算）
    const maxValue =
      top10Keys.length > 0 ? getSortValue(top10Keys[0], sortBy) : 0

    // 9. 添加排名和百分比
    const leaderboard: LeaderboardItem[] = top10Keys.map((key, index) => ({
      ...key,
      rank: index + 1,
      percentage: calculatePercentage(getSortValue(key, sortBy), maxValue),
    }))

    // 10. 构建响应
    const response: LeaderboardResponse = {
      leaderboard,
      metadata: {
        totalKeys: keys.length,
        displayedKeys: leaderboard.length,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
