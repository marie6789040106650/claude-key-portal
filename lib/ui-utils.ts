/**
 * UI 工具函数
 *
 * 封装常用的 UI 相关辅助函数
 */

/**
 * 状态徽章变体映射
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'PAUSED':
      return 'secondary'
    case 'EXPIRED':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * 格式化时间
 */
export function formatTime(time: string | null): string {
  if (!time) return '从未使用'
  return new Date(time).toLocaleString('zh-CN')
}

/**
 * 格式化日期（只显示日期部分）
 */
export function formatDateOnly(time: string): string {
  return new Date(time).toLocaleDateString('zh-CN')
}

/**
 * 计算百分比并格式化
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}
