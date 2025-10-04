/**
 * 数据导出工具
 *
 * 支持多种格式导出统计数据
 */

import type { KeyStats, TimeSeriesDataPoint } from '@/types/stats'

export type ExportFormat = 'csv' | 'json'

export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat
  /** 选择的字段 */
  fields?: string[]
  /** 包含时间序列数据 */
  includeTimeSeries?: boolean
  /** 文件名（不含扩展名） */
  filename?: string
}

/**
 * 将数据导出为CSV格式
 */
export function exportToCSV(
  data: KeyStats[],
  fields?: string[]
): string {
  const defaultFields = [
    'name',
    'status',
    'totalRequests',
    'totalTokens',
    'monthlyUsage',
    'lastUsedAt',
  ]

  const selectedFields = fields || defaultFields

  // 字段标题映射
  const fieldLabels: Record<string, string> = {
    name: '密钥名称',
    status: '状态',
    totalRequests: '总请求数',
    totalTokens: '总Token数',
    monthlyUsage: '本月使用量',
    lastUsedAt: '最后使用时间',
    createdAt: '创建时间',
  }

  // 生成表头
  const headers = selectedFields.map((field) => fieldLabels[field] || field)

  // 生成数据行
  const rows = data.map((item) =>
    selectedFields.map((field) => {
      const value = item[field as keyof KeyStats]

      // 格式化不同类型的值
      if (value === null || value === undefined) {
        return '从未使用'
      }

      if (typeof value === 'number') {
        return value.toString()
      }

      if (field.includes('At') && typeof value === 'string') {
        // 日期格式化
        return new Date(value).toLocaleString('zh-CN')
      }

      return String(value)
    })
  )

  // 组合CSV
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ].join('\n')

  return csv
}

/**
 * 将数据导出为JSON格式
 */
export function exportToJSON(
  data: KeyStats[],
  fields?: string[]
): string {
  if (fields && fields.length > 0) {
    // 只导出选定的字段
    const filtered = data.map((item) => {
      const result: Partial<KeyStats> = {}
      fields.forEach((field) => {
        if (field in item) {
          result[field as keyof KeyStats] = item[field as keyof KeyStats] as any
        }
      })
      return result
    })
    return JSON.stringify(filtered, null, 2)
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 导出时间序列数据
 */
export function exportTimeSeriesData(
  data: TimeSeriesDataPoint[],
  format: ExportFormat = 'csv'
): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  // CSV格式
  const headers = ['时间', '请求数', 'Token数']
  const rows = data.map((point) => [
    new Date(point.timestamp).toLocaleDateString('zh-CN'),
    point.requests.toString(),
    point.tokens.toString(),
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')
}

/**
 * 转义CSV值
 */
function escapeCSVValue(value: string): string {
  // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * 触发文件下载
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * 生成导出文件名
 */
export function generateExportFilename(
  prefix: string = 'export',
  format: ExportFormat = 'csv'
): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${prefix}-${timestamp}.${format}`
}

/**
 * 执行数据导出
 */
export function executeExport(
  data: KeyStats[],
  options: ExportOptions
): void {
  const {
    format,
    fields,
    filename = 'usage-stats',
  } = options

  let content: string
  let mimeType: string

  if (format === 'csv') {
    content = exportToCSV(data, fields)
    mimeType = 'text/csv'
  } else {
    content = exportToJSON(data, fields)
    mimeType = 'application/json'
  }

  const exportFilename = generateExportFilename(filename, format)
  downloadFile(content, exportFilename, mimeType)
}
