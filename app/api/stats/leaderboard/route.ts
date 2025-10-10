/**
 * Leaderboard Stats API
 * GET /api/stats/leaderboard - 获取密钥使用量Top 10排行榜
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import { getCacheManager } from '@/lib/infrastructure/cache/cache-manager'
import {
  type SortBy,
  type LeaderboardResponse,
  type KeyStats,
  bigIntToNumber,
  calculateCost,
  isValidSortBy,
  sortKeysByDimension,
  generateLeaderboard,
} from './utils'

// 初始化缓存管理器
const cacheManager = getCacheManager()

/**
 * GET /api/stats/leaderboard - 获取排行榜
 *
 * 查询参数:
 * - sortBy: 排序维度 (tokens|requests|cost)，默认为 tokens
 */
export async function GET(request: Request) {
  try {
    // 1. 验证用户认证（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    const userId = user.userId

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url)
    const sortByParam = searchParams.get('sortBy') || 'tokens'

    // 3. 验证 sortBy 参数
    if (!isValidSortBy(sortByParam)) {
      return NextResponse.json(
        { error: 'sortBy 参数必须是 tokens、requests 或 cost 之一' },
        { status: 400 }
      )
    }

    const sortBy = sortByParam

    // 4. 尝试从缓存获取
    const cacheKey = cacheManager.generateKey(
      'stats',
      'leaderboard',
      userId,
      sortBy
    )
    const cached = await cacheManager.get<LeaderboardResponse>(cacheKey)

    if (cached) {
      console.log('[Cache] Leaderboard cache hit')
      return NextResponse.json(cached)
    }

    // 5. 缓存未命中，查询数据库
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
    const keysWithStats: KeyStats[] = keys.map(k => ({
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
    const sortedKeys = sortKeysByDimension(keysWithStats, sortBy)

    // 7. 生成排行榜（Top 10 + 排名 + 百分比）
    const leaderboard = generateLeaderboard(sortedKeys, sortBy, 10)

    // 8. 构建响应
    const response: LeaderboardResponse = {
      leaderboard,
      metadata: {
        totalKeys: keys.length,
        displayedKeys: leaderboard.length,
      },
    }

    // 9. 缓存结果（60秒TTL）
    await cacheManager.set(cacheKey, response, cacheManager.getTTL('stats'))
    console.log('[Cache] Leaderboard cached for 60s')

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
