/**
 * Leaderboard Utils
 * 排行榜工具函数和类型定义
 */

/**
 * 排序维度类型
 */
export type SortBy = 'tokens' | 'requests' | 'cost'

/**
 * 排行榜项目接口
 */
export interface LeaderboardItem {
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
export interface LeaderboardResponse {
  leaderboard: LeaderboardItem[]
  metadata: {
    totalKeys: number
    displayedKeys: number
  }
}

/**
 * 密钥统计数据接口
 */
export interface KeyStats {
  id: string
  name: string
  status: string
  totalTokens: number
  totalRequests: number
  cost: number
  createdAt: Date
  lastUsedAt: Date | null
}

/**
 * 工具函数：安全地将 BigInt 转换为 Number
 */
export function bigIntToNumber(value: bigint | null | undefined): number {
  return value ? Number(value) : 0
}

/**
 * 工具函数：计算成本（基于 token 数）
 * 假设成本计算公式: cost = totalTokens / 100000
 *
 * @param totalTokens - 总 token 数
 * @returns 成本（保留4位小数）
 */
export function calculateCost(totalTokens: number): number {
  return Number((totalTokens / 100000).toFixed(4))
}

/**
 * 工具函数：计算相对百分比
 *
 * @param value - 当前值
 * @param maxValue - 最大值
 * @returns 百分比（0-100的整数）
 */
export function calculatePercentage(value: number, maxValue: number): number {
  if (maxValue === 0) return 0
  return Math.round((value / maxValue) * 100)
}

/**
 * 工具函数：根据排序维度获取排序值
 *
 * @param item - 密钥统计数据
 * @param sortBy - 排序维度
 * @returns 排序值
 */
export function getSortValue(
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
 * 工具函数：验证排序维度参数
 *
 * @param sortBy - 排序维度字符串
 * @returns 是否有效
 */
export function isValidSortBy(sortBy: string): sortBy is SortBy {
  const validValues: SortBy[] = ['tokens', 'requests', 'cost']
  return validValues.includes(sortBy as SortBy)
}

/**
 * 工具函数：对密钥按指定维度排序
 *
 * @param keys - 密钥数组
 * @param sortBy - 排序维度
 * @returns 排序后的密钥数组
 */
export function sortKeysByDimension(
  keys: KeyStats[],
  sortBy: SortBy
): KeyStats[] {
  return [...keys].sort((a, b) => {
    const aValue = getSortValue(a, sortBy)
    const bValue = getSortValue(b, sortBy)
    return bValue - aValue // 降序排序
  })
}

/**
 * 工具函数：生成排行榜（添加排名和百分比）
 *
 * @param keys - 排序后的密钥数组
 * @param sortBy - 排序维度
 * @param limit - 返回数量限制（默认10）
 * @returns 排行榜数组
 */
export function generateLeaderboard(
  keys: KeyStats[],
  sortBy: SortBy,
  limit: number = 10
): LeaderboardItem[] {
  // 取 Top N
  const topKeys = keys.slice(0, limit)

  // 计算最大值（用于百分比计算）
  const maxValue = topKeys.length > 0 ? getSortValue(topKeys[0], sortBy) : 0

  // 添加排名和百分比
  return topKeys.map((key, index) => ({
    ...key,
    rank: index + 1,
    percentage: calculatePercentage(getSortValue(key, sortBy), maxValue),
  }))
}
