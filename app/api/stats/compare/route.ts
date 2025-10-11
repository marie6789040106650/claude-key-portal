/**
 * Compare Stats API
 * GET /api/stats/compare - 多密钥使用对比
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { getCacheManager } from '@/lib/infrastructure/cache/cache-manager'
import {
  validateKeyIdsParam,
  calculateComparison,
  type KeyCompareData,
  type CompareResponse,
} from './utils'

// 初始化缓存管理器
const cacheManager = getCacheManager()

/**
 * 获取多个密钥的CRS统计（并行调用，带缓存）
 */
async function fetchKeyStatsInParallel(
  keys: Array<{ id: string; name: string; crsKey: string }>
): Promise<{
  keysWithStats: KeyCompareData[]
  hasError: boolean
}> {
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      // 1. 尝试从缓存获取
      const cacheKey = cacheManager.generateKey('crs', 'key-stats', key.id)
      const cached = await cacheManager.get(cacheKey)

      if (cached) {
        console.log(`[Cache] Key stats cache hit for ${key.id}`)
        return {
          id: key.id,
          name: key.name,
          stats: cached,
        }
      }

      // 2. 缓存未命中，从CRS获取
      const stats = await crsClient.getKeyStats(key.crsKey)

      // 3. 缓存结果（60秒TTL）
      await cacheManager.set(cacheKey, stats, cacheManager.getTTL('stats'))
      console.log(`[Cache] Key stats cached for ${key.id}`)

      return {
        id: key.id,
        name: key.name,
        stats: {
          totalTokens: stats.totalTokens,
          totalRequests: stats.totalRequests,
          inputTokens: stats.inputTokens,
          outputTokens: stats.outputTokens,
          cost: stats.cost,
        },
      }
    })
  )

  let hasError = false
  const keysWithStats: KeyCompareData[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      keysWithStats.push(result.value)
    } else {
      // CRS 调用失败，使用空数据
      hasError = true
      keysWithStats.push({
        id: keys[index].id,
        name: keys[index].name,
        stats: {
          totalTokens: 0,
          totalRequests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        },
      })
    }
  })

  return { keysWithStats, hasError }
}


/**
 * GET /api/stats/compare
 *
 * 查询参数:
 * - keyIds: 逗号分隔的密钥ID列表 (2-5个)
 *
 * @example
 * GET /api/stats/compare?keyIds=key-1,key-2,key-3
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户认证（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 获取并验证参数
    const { searchParams } = new URL(request.url)
    const keyIdsParam = searchParams.get('keyIds')

    const validation = validateKeyIdsParam(keyIdsParam)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const keyIds = validation.keyIds!

    // 3. 查询数据库获取密钥信息（仅限用户自己的密钥）
    const keys = await prisma.apiKey.findMany({
      where: {
        id: { in: keyIds },
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        crsKey: true,
        status: true,
      },
    })

    // 4. 验证密钥是否存在
    if (keys.length === 0) {
      return NextResponse.json(
        { error: '找不到指定的密钥' },
        { status: 404 }
      )
    }

    // 5. 并行获取 CRS 统计数据
    const { keysWithStats, hasError } = await fetchKeyStatsInParallel(keys)

    // 6. 计算对比数据
    const comparison = calculateComparison(keysWithStats)

    // 7. 构建响应
    const response: CompareResponse = {
      keys: keysWithStats,
      comparison,
    }

    // 如果有 CRS 错误，添加警告
    if (hasError) {
      response.warning = 'CRS服务暂时不可用，部分数据可能不准确'
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Compare stats error:', error)
    return NextResponse.json(
      { error: '获取对比数据失败' },
      { status: 500 }
    )
  }
}
