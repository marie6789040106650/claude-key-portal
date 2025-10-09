/**
 * Compare Stats API
 * GET /api/stats/compare - 多密钥使用对比
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

/**
 * 密钥统计信息
 */
interface KeyStats {
  totalTokens: number
  totalRequests: number
  inputTokens: number
  outputTokens: number
  cost: number
}

/**
 * 密钥对比数据
 */
interface KeyCompareData {
  id: string
  name: string
  stats: KeyStats
}

/**
 * 对比结果
 */
interface ComparisonResult {
  maxTokens: { keyId: string; keyName: string; value: number }
  maxRequests: { keyId: string; keyName: string; value: number }
  maxCost: { keyId: string; keyName: string; value: number }
  totalTokens: number
  totalRequests: number
  totalCost: number
}

/**
 * API 响应格式
 */
interface CompareResponse {
  keys: KeyCompareData[]
  comparison: ComparisonResult
  warning?: string
}

/**
 * 获取多个密钥的CRS统计（并行调用）
 */
async function fetchKeyStatsInParallel(
  keys: Array<{ id: string; name: string; crsKey: string }>
): Promise<{
  keysWithStats: KeyCompareData[]
  hasError: boolean
}> {
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const stats = await crsClient.getKeyStats(key.crsKey)
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
 * 计算对比数据
 */
function calculateComparison(keys: KeyCompareData[]): ComparisonResult {
  let maxTokens = { keyId: '', keyName: '', value: 0 }
  let maxRequests = { keyId: '', keyName: '', value: 0 }
  let maxCost = { keyId: '', keyName: '', value: 0 }
  let totalTokens = 0
  let totalRequests = 0
  let totalCost = 0

  keys.forEach((key) => {
    // 累加总计
    totalTokens += key.stats.totalTokens
    totalRequests += key.stats.totalRequests
    totalCost += key.stats.cost

    // 找出最大值
    if (key.stats.totalTokens > maxTokens.value) {
      maxTokens = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.totalTokens,
      }
    }

    if (key.stats.totalRequests > maxRequests.value) {
      maxRequests = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.totalRequests,
      }
    }

    if (key.stats.cost > maxCost.value) {
      maxCost = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.cost,
      }
    }
  })

  return {
    maxTokens,
    maxRequests,
    maxCost,
    totalTokens,
    totalRequests,
    totalCost,
  }
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
    // 1. 验证认证
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const user = verifyToken(authHeader.replace('Bearer ', ''))

    // 2. 获取并验证参数
    const { searchParams } = new URL(request.url)
    const keyIdsParam = searchParams.get('keyIds')

    if (!keyIdsParam) {
      return NextResponse.json(
        { error: '缺少必需参数: keyIds' },
        { status: 400 }
      )
    }

    const keyIds = keyIdsParam.split(',').filter((id) => id.trim())

    // 验证密钥数量
    if (keyIds.length < 2) {
      return NextResponse.json(
        { error: '至少需要2个密钥进行对比' },
        { status: 400 }
      )
    }

    if (keyIds.length > 5) {
      return NextResponse.json(
        { error: '最多支持5个密钥对比' },
        { status: 400 }
      )
    }

    // 3. 查询数据库获取密钥信息（仅限用户自己的密钥）
    const keys = await prisma.apiKey.findMany({
      where: {
        id: { in: keyIds },
        userId: user.userId,
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
