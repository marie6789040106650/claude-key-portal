/**
 * Usage Stats API
 * GET /api/stats/usage - 获取使用统计数据
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'
import { getCacheManager } from '@/lib/infrastructure/cache/cache-manager'
import {
  type FilterParams,
  validateAllFilters,
  buildAdvancedFilters,
} from './filters'

// 初始化缓存管理器
const cacheManager = getCacheManager()

/**
 * 类型定义
 */
interface CrsDashboardData {
  totalKeys: number
  activeKeys: number
  totalTokens: number
  totalRequests: number
}

interface CrsTrendData {
  date: string // YYYY-MM-DD
  requests: number
  tokens: number
  cost?: number
}

// 趋势数据点（前端格式）
interface TrendDataPoint {
  timestamp: string // ISO 8601 格式
  tokens: number
  requests: number
}

interface StatsResponse {
  summary: {
    totalTokens: number
    totalRequests: number
    averageTokensPerRequest: number
    keyCount: number
  }
  keys: Array<{
    id: string
    name: string
    status: string
    totalTokens: number
    totalRequests: number
    createdAt: Date
    lastUsedAt: Date | null
  }>
  crsDashboard?: CrsDashboardData
  crsWarning?: string
  trend?: TrendDataPoint[] // 使用前端格式
  trendWarning?: string
}

/**
 * 工具函数：转换CRS趋势数据为前端格式
 */
function transformTrendData(item: CrsTrendData): TrendDataPoint {
  return {
    timestamp: new Date(item.date).toISOString(),
    tokens: item.tokens || 0,
    requests: item.requests || 0,
  }
}

/**
 * 工具函数：验证日期字符串
 */
function validateDate(dateString: string): Date | null {
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * 工具函数：构建时间范围过滤条件
 * @returns { valid: boolean, where?: object, error?: string }
 */
function buildDateRangeFilter(
  startDate: string | null,
  endDate: string | null
): {
  valid: boolean
  where?: { createdAt: { gte?: Date; lte?: Date } }
  error?: string
} {
  if (!startDate && !endDate) {
    return { valid: true }
  }

  const where: { createdAt: { gte?: Date; lte?: Date } } = { createdAt: {} }

  if (startDate) {
    const start = validateDate(startDate)
    if (!start) {
      return { valid: false, error: '时间范围参数格式不正确' }
    }
    where.createdAt.gte = start
  }

  if (endDate) {
    const end = validateDate(endDate)
    if (!end) {
      return { valid: false, error: '时间范围参数格式不正确' }
    }
    where.createdAt.lte = end
  }

  return { valid: true, where }
}

// 筛选和验证函数已移至 ./filters.ts

/**
 * 工具函数：构建CRS趋势查询参数
 * 默认返回最近7天的数据
 */
function buildTrendParams(
  startDate: string | null,
  endDate: string | null
): { startDate: string; endDate: string } {
  // 如果没有提供日期，使用默认的最近7天
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  return {
    startDate: startDate || sevenDaysAgo.toISOString().split('T')[0],
    endDate: endDate || now.toISOString().split('T')[0],
  }
}

/**
 * 工具函数：安全地将BigInt转换为Number
 */
function bigIntToNumber(value: bigint | null | undefined): number {
  return value ? Number(value) : 0
}

/**
 * 工具函数：获取CRS Dashboard数据（带缓存和降级处理）
 */
async function fetchCrsDashboardSafely(): Promise<{
  data?: CrsDashboardData
  warning?: string
}> {
  // 1. 尝试从缓存获取
  const cacheKey = cacheManager.generateKey('crs', 'dashboard', 'global')
  const cached = await cacheManager.get<CrsDashboardData>(cacheKey)

  if (cached) {
    console.log('[Cache] Dashboard cache hit')
    return { data: cached }
  }

  // 2. 缓存未命中，从CRS获取
  try {
    const data = await crsClient.getDashboard()

    // 3. 缓存结果（60秒TTL）
    await cacheManager.set(cacheKey, data, cacheManager.getTTL('dashboard'))
    console.log('[Cache] Dashboard cached for 60s')

    return { data }
  } catch (error) {
    console.warn('CRS Dashboard API unavailable, using local stats:', error)
    return { warning: 'CRS服务暂时不可用，显示本地统计数据' }
  }
}

/**
 * 工具函数：获取CRS Usage Trend数据（带缓存和降级处理）
 */
async function fetchCrsUsageTrendSafely(params?: {
  startDate?: string
  endDate?: string
}): Promise<{
  data?: CrsTrendData[]
  warning?: string
}> {
  // 1. 生成缓存键（包含日期参数）
  const dateRange = params
    ? `${params.startDate || 'start'}-${params.endDate || 'end'}`
    : 'all'
  const cacheKey = cacheManager.generateKey('crs', 'trend', dateRange)

  // 2. 尝试从缓存获取
  const cached = await cacheManager.get<CrsTrendData[]>(cacheKey)

  if (cached) {
    console.log('[Cache] Trend cache hit')
    return { data: cached }
  }

  // 3. 缓存未命中，从CRS获取
  try {
    const data = await crsClient.getUsageTrend(params)

    // 4. 缓存结果（300秒TTL = 5分钟）
    await cacheManager.set(cacheKey, data, cacheManager.getTTL('trend'))
    console.log('[Cache] Trend cached for 300s')

    return { data }
  } catch (error) {
    console.warn('Failed to fetch trend data from CRS:', error)
    return { warning: '趋势数据暂时不可用' }
  }
}

/**
 * GET /api/stats/usage - 获取使用统计
 *
 * 查询参数:
 * - keyId: 获取单个密钥统计（可选）
 * - realtime: 是否从CRS获取实时统计（可选）
 * - startDate: 开始日期（可选）
 * - endDate: 结束日期（可选）
 * - 注：趋势数据默认包含在响应中
 *
 * 高级搜索筛选参数:
 * - name: 按名称搜索（可选）
 * - status: 按状态筛选 active/inactive（可选）
 * - minTokens: 最小Token数（可选）
 * - maxTokens: 最大Token数（可选）
 * - minRequests: 最小请求数（可选）
 * - maxRequests: 最大请求数（可选）
 * - lastUsedAfter: 最后使用时间晚于（可选）
 * - lastUsedBefore: 最后使用时间早于（可选）
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

    // 高级搜索筛选参数
    const name = searchParams.get('name')
    const status = searchParams.get('status')
    const minTokens = searchParams.get('minTokens')
    const maxTokens = searchParams.get('maxTokens')
    const minRequests = searchParams.get('minRequests')
    const maxRequests = searchParams.get('maxRequests')
    const lastUsedAfter = searchParams.get('lastUsedAfter')
    const lastUsedBefore = searchParams.get('lastUsedBefore')

    // 3. 构建并验证高级搜索参数
    const filterParams: FilterParams = {
      name,
      status,
      minTokens,
      maxTokens,
      minRequests,
      maxRequests,
      lastUsedAfter,
      lastUsedBefore,
    }

    const validation = validateAllFilters(filterParams)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 4. 如果指定了keyId，返回单个密钥统计
    if (keyId) {
      return await getSingleKeyStats(userId, keyId, realtime)
    }

    // 5. 否则返回所有密钥的聚合统计（应用高级筛选）
    return await getAllKeysStats(userId, startDate, endDate, filterParams)
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
      crsKey: true, // 完整密钥值
      status: true,
      totalTokens: true,
      totalCalls: true, // 替代 totalRequests
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

  // 4. 构建响应（使用工具函数转换 BigInt）
  const response: any = {
    key: {
      id: key.id,
      name: key.name,
      status: key.status,
      totalTokens: bigIntToNumber(key.totalTokens),
      totalRequests: bigIntToNumber(key.totalCalls),
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    },
  }

  // 5. 可选：从CRS获取实时统计（带缓存）
  if (realtime && key.crsKey) {
    // 5.1 尝试从缓存获取
    const statsCacheKey = cacheManager.generateKey('crs', 'key-stats', key.id)
    const cachedStats = await cacheManager.get(statsCacheKey)

    if (cachedStats) {
      console.log('[Cache] Key stats cache hit')
      response.key.realtimeStats = cachedStats
    } else {
      // 5.2 缓存未命中，从CRS获取
      try {
        const realtimeStats = await crsClient.getKeyStats(key.crsKey)
        response.key.realtimeStats = realtimeStats

        // 5.3 缓存结果（60秒TTL）
        await cacheManager.set(
          statsCacheKey,
          realtimeStats,
          cacheManager.getTTL('stats')
        )
        console.log('[Cache] Key stats cached for 60s')
      } catch (error) {
        response.crsWarning = '实时统计暂时不可用，显示缓存数据'
      }
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
  endDate: string | null,
  includeTrend: boolean = false,
  filterParams?: FilterParams
) {
  // 1. 验证和构建时间范围过滤
  const dateFilter = buildDateRangeFilter(startDate, endDate)
  if (!dateFilter.valid) {
    return NextResponse.json({ error: dateFilter.error }, { status: 400 })
  }

  // 2. 构建查询条件（合并时间范围和高级筛选）
  const where: any = {
    userId,
    ...dateFilter.where,
  }

  // 应用高级搜索筛选
  if (filterParams) {
    const advancedFilters = buildAdvancedFilters(filterParams)
    Object.assign(where, advancedFilters)
  }

  // 3. 查询所有密钥
  const keys = await prisma.apiKey.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
      totalTokens: true,
      totalCalls: true, // 替代 totalRequests
      createdAt: true,
      lastUsedAt: true,
    },
  })

  // 4. 聚合统计（使用工具函数转换 BigInt）
  const totalTokens = keys.reduce(
    (sum, k) => sum + bigIntToNumber(k.totalTokens),
    0
  )
  const totalRequests = keys.reduce(
    (sum, k) => sum + bigIntToNumber(k.totalCalls),
    0
  )

  const summary = {
    totalTokens,
    totalRequests,
    averageTokensPerRequest:
      totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    keyCount: keys.length,
  }

  // 5. 转换响应中的 BigInt（使用工具函数）
  const keysResponse = keys.map(k => {
    const { totalCalls, ...rest } = k // 解构移除 totalCalls
    return {
      ...rest,
      totalTokens: bigIntToNumber(k.totalTokens),
      totalRequests: bigIntToNumber(k.totalCalls),
    }
  })

  // 6. 获取 CRS Dashboard 数据（使用工具函数处理降级）
  const { data: crsDashboard, warning: crsWarning } =
    await fetchCrsDashboardSafely()

  // 7. 获取 CRS Usage Trend 数据（默认获取）
  const trendParams = buildTrendParams(startDate, endDate)
  const { data: crsTrendData, warning: trendWarning } =
    await fetchCrsUsageTrendSafely(trendParams)

  // 8. 转换趋势数据为前端格式
  const trendData: TrendDataPoint[] = crsTrendData
    ? crsTrendData.map(transformTrendData)
    : []

  // 9. 构建响应
  const response: StatsResponse = {
    summary,
    keys: keysResponse,
    trend: trendData, // 始终包含趋势数据（可能为空数组）
  }

  if (crsDashboard) {
    response.crsDashboard = crsDashboard
  }

  // 10. 合并所有警告消息
  const warnings: string[] = []
  if (crsWarning) warnings.push(crsWarning)
  if (trendWarning) warnings.push(trendWarning)

  if (warnings.length > 0) {
    response.crsWarning = warnings.join('; ')
  }

  return NextResponse.json(response)
}
