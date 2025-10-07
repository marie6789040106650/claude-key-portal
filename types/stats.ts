/**
 * 统计数据类型定义
 *
 * 用于密钥使用统计和可视化
 */

/**
 * 仪表板概览数据
 */
export interface DashboardOverview {
  totalKeys: number
  activeKeys: number
  pausedKeys: number
  totalTokensUsed: number
  totalRequests: number
  monthlyUsage: number
}

/**
 * 最近活动
 */
export interface RecentActivity {
  id: string
  name: string
  lastUsedAt: string | null
  totalRequests: number
}

/**
 * 仪表板响应
 */
export interface DashboardResponse {
  overview: DashboardOverview
  recentActivity: RecentActivity[]
  crsStats?: any
  crsStatsError?: string
}

/**
 * 密钥统计信息
 */
export interface KeyStats {
  id: string
  name: string
  status: string
  totalTokens: number
  totalRequests: number
  monthlyUsage: number
  createdAt: string
  lastUsedAt: string | null
  realtimeStats?: any
}

/**
 * 单个密钥统计响应
 */
export interface SingleKeyStatsResponse {
  key: KeyStats
  crsWarning?: string
}

/**
 * 统计汇总
 */
export interface StatsSummary {
  totalTokens: number
  totalRequests: number
  averageTokensPerRequest: number
  keyCount: number
}

/**
 * 所有密钥统计响应
 */
export interface AllKeysStatsResponse {
  summary: StatsSummary
  keys: KeyStats[]
}

/**
 * 时间点数据（用于图表）
 */
export interface TimeSeriesDataPoint {
  /** 时间戳或日期字符串 */
  timestamp: string
  /** 请求数 */
  requests: number
  /** Token 使用量 */
  tokens: number
  /** 错误数（可选） */
  errors?: number
}

/**
 * 时间序列统计响应
 */
export interface TimeSeriesStatsResponse {
  /** 时间序列数据点 */
  data: TimeSeriesDataPoint[]
  /** 汇总信息 */
  summary: {
    totalRequests: number
    totalTokens: number
    avgRequestsPerPeriod: number
    avgTokensPerPeriod: number
    period: 'hour' | 'day' | 'week' | 'month'
  }
}

/**
 * 密钥使用排行项
 */
export interface KeyRankingItem {
  id: string
  name: string
  requests: number
  tokens: number
  rank: number
}

/**
 * 密钥排行响应
 */
export interface KeyRankingResponse {
  rankings: KeyRankingItem[]
  period: string
}

/**
 * 时间范围类型
 */
export type DateRange = {
  startDate: string
  endDate: string
}

/**
 * 时间范围快捷选项
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

/**
 * 导出数据格式
 */
export interface ExportData {
  keys: Array<{
    name: string
    status: string
    requests: number
    tokens: number
    lastUsed: string
  }>
  summary: {
    totalKeys: number
    totalRequests: number
    totalTokens: number
    exportDate: string
  }
}

/**
 * 图表数据配置
 */
export interface ChartConfig {
  showRequests: boolean
  showTokens: boolean
  showErrors: boolean
  chartType: 'line' | 'bar' | 'area'
}

/**
 * 筛选器配置
 */
export interface StatsFilter {
  /** 时间范围 */
  dateRange: DateRange
  /** 选中的密钥ID列表 */
  selectedKeys: string[]
  /** 密钥状态筛选 */
  status?: 'ALL' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'
}
