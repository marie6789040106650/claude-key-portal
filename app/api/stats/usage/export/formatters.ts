/**
 * Export Formatters - CSV和JSON格式化工具
 *
 * 提供数据导出的格式化功能
 */

/**
 * CSV格式化工具
 */

/**
 * 转义CSV字段
 * 处理特殊字符（逗号、引号、换行符）
 */
export function escapeCSVField(
  field: string | number | null | undefined
): string {
  if (field === null || field === undefined) {
    return ''
  }

  const str = String(field)

  // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * 格式化日期为CSV格式（YYYY-MM-DD）
 */
export function formatDateForCSV(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

/**
 * 将API Key数据转换为CSV格式
 */
export function convertToCSV(data: any[]): string {
  // CSV表头
  const headers = [
    '密钥名称',
    '状态',
    '总Token数',
    '总请求数',
    '创建时间',
    '最后使用时间',
  ]

  // 构建CSV内容
  const rows = data.map((item) =>
    [
      escapeCSVField(item.name),
      escapeCSVField(item.status),
      escapeCSVField(Number(item.totalTokens)),
      escapeCSVField(Number(item.totalCalls)),
      formatDateForCSV(item.createdAt),
      formatDateForCSV(item.lastUsedAt),
    ].join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

/**
 * JSON格式化工具
 */

/**
 * 过滤掉null和undefined的筛选条件
 */
export function filterActiveFilters(
  filters: Record<string, any>
): Record<string, any> {
  return Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )
}

/**
 * 将API Key数据转换为JSON格式
 */
export function convertToJSON(
  data: any[],
  userId: string,
  filters: Record<string, any>
): string {
  const activeFilters = filterActiveFilters(filters)

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    filters: activeFilters,
    totalCount: data.length,
    data: data.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      totalTokens: Number(item.totalTokens),
      totalRequests: Number(item.totalCalls),
      createdAt: item.createdAt.toISOString(),
      lastUsedAt: item.lastUsedAt?.toISOString() || null,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * 文件名工具
 */

/**
 * 生成带时间戳的文件名
 * 格式：usage-stats-YYYY-MM-DDTHH-mm-ss.{format}
 */
export function generateFilename(format: string): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  return `usage-stats-${timestamp}.${format}`
}
