/**
 * Usage Stats API
 * GET /api/stats/usage - 获取使用统计数据
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'

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
  totalRequests: number
  totalTokens: number
  cost: number
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
  trend?: CrsTrendData[]
  trendWarning?: string
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

/**
 * 工具函数：构建CRS趋势查询参数
 */
function buildTrendParams(
  startDate: string | null,
  endDate: string | null
): { startDate?: string; endDate?: string } {
  const params: { startDate?: string; endDate?: string } = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return params
}

/**
 * 工具函数：安全地将BigInt转换为Number
 */
function bigIntToNumber(value: bigint | null | undefined): number {
  return value ? Number(value) : 0
}

/**
 * 工具函数：获取CRS Dashboard数据（带降级处理）
 */
async function fetchCrsDashboardSafely(): Promise<{
  data?: CrsDashboardData
  warning?: string
}> {
  try {
    const data = await crsClient.getDashboard()
    return { data }
  } catch (error) {
    console.warn('CRS Dashboard API unavailable, using local stats:', error)
    return { warning: 'CRS服务暂时不可用，显示本地统计数据' }
  }
}

/**
 * 工具函数：获取CRS Usage Trend数据（带降级处理）
 */
async function fetchCrsUsageTrendSafely(params?: {
  startDate?: string
  endDate?: string
}): Promise<{
  data?: CrsTrendData[]
  warning?: string
}> {
  try {
    const data = await crsClient.getUsageTrend(params)
    return { data }
  } catch (error) {
    console.warn('CRS Usage Trend API unavailable:', error)
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
    const includeTrend = searchParams.get('includeTrend') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 3. 如果指定了keyId，返回单个密钥统计
    if (keyId) {
      return await getSingleKeyStats(userId, keyId, realtime)
    }

    // 4. 否则返回所有密钥的聚合统计
    return await getAllKeysStats(userId, startDate, endDate, includeTrend)
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

  // 5. 可选：从CRS获取实时统计
  if (realtime && key.crsKey) {
    try {
      const realtimeStats = await crsClient.getKeyStats(key.crsKey)
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
  endDate: string | null,
  includeTrend: boolean = false
) {
  // 1. 验证和构建时间范围过滤
  const dateFilter = buildDateRangeFilter(startDate, endDate)
  if (!dateFilter.valid) {
    return NextResponse.json({ error: dateFilter.error }, { status: 400 })
  }

  // 2. 构建查询条件
  const where: any = {
    userId,
    ...dateFilter.where,
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
  const keysResponse = keys.map(k => ({
    ...k,
    totalTokens: bigIntToNumber(k.totalTokens),
    totalRequests: bigIntToNumber(k.totalCalls),
  }))

  // 6. 获取 CRS Dashboard 数据（使用工具函数处理降级）
  const { data: crsDashboard, warning: crsWarning } =
    await fetchCrsDashboardSafely()

  // 7. 可选：获取 CRS Usage Trend 数据
  let crsTrend: CrsTrendData[] | undefined
  let trendWarning: string | undefined

  if (includeTrend) {
    const trendParams = buildTrendParams(startDate, endDate)
    const { data, warning } = await fetchCrsUsageTrendSafely(trendParams)
    crsTrend = data
    trendWarning = warning
  }

  // 8. 构建响应
  const response: StatsResponse = {
    summary,
    keys: keysResponse,
  }

  if (crsDashboard) {
    response.crsDashboard = crsDashboard
  }

  if (crsWarning) {
    response.crsWarning = crsWarning
  }

  if (crsTrend) {
    response.trend = crsTrend
  }

  if (trendWarning) {
    response.trendWarning = trendWarning
  }

  return NextResponse.json(response)
}
