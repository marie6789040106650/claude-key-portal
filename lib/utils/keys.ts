/**
 * 密钥管理工具函数
 *
 * 提供密钥格式化、状态映射、错误处理等通用功能
 */

/**
 * 格式化密钥显示（仅显示前缀）
 *
 * @param key - 完整的密钥字符串
 * @param prefixLength - 前缀显示长度，默认 8
 * @returns 格式化后的密钥，如 "sk-abc123..."
 *
 * @example
 * formatKeyMasked("sk-abc123def456ghi789") // "sk-abc123..."
 */
export function formatKeyMasked(key: string, prefixLength: number = 8): string {
  if (!key || key.length <= prefixLength) {
    return key
  }
  return `${key.substring(0, prefixLength)}...`
}

/**
 * 密钥状态类型
 */
export type KeyStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

/**
 * 状态徽章变体类型
 */
export type StatusBadgeVariant = 'default' | 'secondary' | 'destructive'

/**
 * 状态信息接口
 */
export interface StatusInfo {
  label: string
  variant: StatusBadgeVariant
}

/**
 * 获取状态徽章样式和标签
 *
 * @param status - 密钥状态
 * @returns 状态信息对象 { label, variant }
 *
 * @example
 * getStatusBadgeVariant('ACTIVE') // { label: '激活', variant: 'default' }
 */
export function getStatusBadgeVariant(status: string): StatusInfo {
  const statusMap: Record<KeyStatus, StatusInfo> = {
    ACTIVE: { label: '激活', variant: 'default' },
    INACTIVE: { label: '未激活', variant: 'secondary' },
    EXPIRED: { label: '已过期', variant: 'destructive' },
  }

  return statusMap[status as KeyStatus] || statusMap.ACTIVE
}

/**
 * API 错误类型
 */
export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

/**
 * 格式化 API 错误信息
 *
 * @param error - 错误对象
 * @returns 格式化后的错误信息
 *
 * @example
 * formatApiError(new Error('Network error')) // { message: '网络错误', code: 'NETWORK_ERROR' }
 */
export function formatApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    }
  }

  return {
    message: '未知错误',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * 错误消息映射表
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Network error': '网络错误',
  'Failed to fetch': '网络错误',
  'fetch failed': '网络错误',
  'NetworkError': '网络错误',
  'Load failed': '加载失败',
  'Not found': '资源不存在',
  'Unauthorized': '未授权',
  'Forbidden': '无权访问',
  'Internal Server Error': '服务器错误',
  'Bad Request': '请求参数错误',
}

/**
 * 翻译错误消息为中文
 *
 * @param message - 英文错误消息
 * @returns 中文错误消息
 *
 * @example
 * translateErrorMessage('Network error') // '网络错误'
 * translateErrorMessage('Unknown error') // 'Unknown error'
 */
export function translateErrorMessage(message: string): string {
  // 精确匹配
  if (ERROR_MESSAGE_MAP[message]) {
    return ERROR_MESSAGE_MAP[message]
  }

  // 模糊匹配
  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (message.includes(key)) {
      return value
    }
  }

  // 无法翻译，返回原消息
  return message
}

/**
 * 格式化日期为相对时间
 *
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的相对时间，如 "2天前"、"1周前"
 *
 * @example
 * formatRelativeTime('2024-10-02') // "2天前"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes === 0) {
        return '刚刚'
      }
      return `${diffMinutes}分钟前`
    }
    return `${diffHours}小时前`
  }

  if (diffDays < 7) {
    return `${diffDays}天前`
  }

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) {
    return `${diffWeeks}周前`
  }

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    return `${diffMonths}个月前`
  }

  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears}年前`
}

/**
 * 格式化数字为带千分位的字符串
 *
 * @param num - 数字或 bigint
 * @returns 格式化后的字符串，如 "1,234,567"
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(BigInt(1234567)) // "1,234,567"
 */
export function formatNumber(num: number | bigint): string {
  return num.toLocaleString('zh-CN')
}
