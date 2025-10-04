/**
 * 统计数据查询 Hooks
 *
 * 封装统计相关的 React Query hooks
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { DateRangePreset, KeyStats } from '@/types/stats'
import { buildDateRangeParams } from '@/lib/date-utils'

/**
 * 统计 API 响应类型
 */
export interface UsageStatsResponse {
  summary: {
    totalTokens: number
    totalRequests: number
    averageTokensPerRequest: number
    keyCount: number
  }
  keys: KeyStats[]
}

/**
 * 使用统计数据 Hook
 */
export function useUsageStats(
  dateRange: DateRangePreset,
  customStartDate?: Date,
  customEndDate?: Date
): UseQueryResult<UsageStatsResponse, Error> {
  const params = buildDateRangeParams(dateRange, customStartDate, customEndDate)

  return useQuery({
    queryKey: ['usage-stats', params],
    queryFn: async () => {
      const response = await fetch(`/api/stats/usage?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  })
}

/**
 * 密钥详情 Hook
 */
export function useKeyDetails(
  keyId: string
): UseQueryResult<KeyStats, Error> {
  return useQuery({
    queryKey: ['key-details', keyId],
    queryFn: async () => {
      const response = await fetch(`/api/keys/${keyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch key details')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * 密钥统计数据 Hook
 */
export function useKeyStats(
  keyId: string,
  dateRange: DateRangePreset,
  customStartDate?: Date,
  customEndDate?: Date
): UseQueryResult<any, Error> {
  const params = buildDateRangeParams(dateRange, customStartDate, customEndDate)

  return useQuery({
    queryKey: ['key-stats', keyId, params],
    queryFn: async () => {
      const response = await fetch(`/api/keys/${keyId}/stats?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch key stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}
