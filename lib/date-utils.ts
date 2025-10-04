/**
 * 日期范围工具函数
 *
 * 用于处理统计页面的日期范围计算
 */

import type { DateRangePreset } from '@/types/stats'

export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * 根据预设类型计算日期范围
 */
export function calculateDateRange(preset: DateRangePreset): DateRange {
  const end = new Date()
  const start = new Date()

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break

    case 'yesterday':
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break

    case 'last7days':
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      break

    case 'last30days':
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      break

    case 'thisMonth':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break

    case 'lastMonth':
      start.setMonth(start.getMonth() - 1)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() - 1)
      end.setDate(0) // 上月最后一天
      end.setHours(23, 59, 59, 999)
      break

    case 'custom':
      // Custom 不应该调用这个函数
      throw new Error('Custom date range should be handled separately')

    default:
      // 默认最近7天
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
  }

  return { startDate: start, endDate: end }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 构建查询参数字符串
 */
export function buildDateRangeParams(
  preset: DateRangePreset,
  customStartDate?: Date,
  customEndDate?: Date
): string {
  const params = new URLSearchParams()

  if (preset === 'custom' && customStartDate && customEndDate) {
    params.append('startDate', formatDate(customStartDate))
    params.append('endDate', formatDate(customEndDate))
  } else if (preset !== 'custom') {
    const { startDate, endDate } = calculateDateRange(preset)
    params.append('startDate', formatDate(startDate))
    params.append('endDate', formatDate(endDate))
  }

  return params.toString()
}

/**
 * 生成时间序列数据点（模拟数据，待替换为真实API）
 */
export function generateMockTimeSeriesData(days: number = 7) {
  const points = []
  const end = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end)
    date.setDate(date.getDate() - i)

    points.push({
      timestamp: formatDate(date),
      requests: Math.floor(Math.random() * 1000),
      tokens: Math.floor(Math.random() * 20000),
    })
  }

  return points
}
