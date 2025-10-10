/**
 * Usage Stats API - Advanced Search Filters
 * 筛选和验证工具函数
 */

/**
 * 筛选参数类型定义
 */
export interface FilterParams {
  name?: string | null
  status?: string | null
  minTokens?: string | null
  maxTokens?: string | null
  minRequests?: string | null
  maxRequests?: string | null
  lastUsedAfter?: string | null
  lastUsedBefore?: string | null
}

/**
 * 验证结果类型
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 验证日期字符串
 */
export function validateDate(dateString: string): Date | null {
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * 验证状态参数
 */
export function validateStatus(status: string | null): ValidationResult {
  if (!status) {
    return { valid: true }
  }

  const validStatuses = ['active', 'inactive']
  if (!validStatuses.includes(status.toLowerCase())) {
    return { valid: false, error: '状态参数无效，只能是 active 或 inactive' }
  }

  return { valid: true }
}

/**
 * 验证使用量范围参数
 */
export function validateUsageRange(
  minValue: string | null,
  maxValue: string | null,
  fieldName: string
): ValidationResult {
  if (!minValue && !maxValue) {
    return { valid: true }
  }

  const min = minValue ? parseInt(minValue, 10) : null
  const max = maxValue ? parseInt(maxValue, 10) : null

  if (min !== null && (isNaN(min) || min < 0)) {
    return { valid: false, error: '使用量参数必须为非负整数' }
  }

  if (max !== null && (isNaN(max) || max < 0)) {
    return { valid: false, error: '使用量参数必须为非负整数' }
  }

  if (min !== null && max !== null && min > max) {
    return { valid: false, error: `${fieldName}最小值不能大于最大值` }
  }

  return { valid: true }
}

/**
 * 验证最后使用时间参数
 */
export function validateLastUsedTime(
  lastUsedAfter: string | null,
  lastUsedBefore: string | null
): ValidationResult {
  if (lastUsedAfter) {
    const date = validateDate(lastUsedAfter)
    if (!date) {
      return { valid: false, error: '最后使用时间参数格式不正确' }
    }
  }

  if (lastUsedBefore) {
    const date = validateDate(lastUsedBefore)
    if (!date) {
      return { valid: false, error: '最后使用时间参数格式不正确' }
    }
  }

  return { valid: true }
}

/**
 * 构建 Prisma 查询筛选条件
 */
export function buildAdvancedFilters(params: FilterParams): any {
  const filters: any = {}

  // 名称搜索（不区分大小写的部分匹配）
  if (params.name) {
    filters.name = {
      contains: params.name,
      mode: 'insensitive',
    }
  }

  // 状态筛选
  if (params.status) {
    filters.status = params.status
  }

  // Token 使用量范围
  if (params.minTokens || params.maxTokens) {
    filters.totalTokens = {}
    if (params.minTokens) {
      filters.totalTokens.gte = BigInt(params.minTokens)
    }
    if (params.maxTokens) {
      filters.totalTokens.lte = BigInt(params.maxTokens)
    }
  }

  // 请求数范围
  if (params.minRequests || params.maxRequests) {
    filters.totalCalls = {}
    if (params.minRequests) {
      filters.totalCalls.gte = BigInt(params.minRequests)
    }
    if (params.maxRequests) {
      filters.totalCalls.lte = BigInt(params.maxRequests)
    }
  }

  // 最后使用时间范围
  if (params.lastUsedAfter || params.lastUsedBefore) {
    filters.lastUsedAt = {}
    if (params.lastUsedAfter) {
      filters.lastUsedAt.gte = new Date(params.lastUsedAfter)
    }
    if (params.lastUsedBefore) {
      filters.lastUsedAt.lte = new Date(params.lastUsedBefore)
    }
  }

  return filters
}

/**
 * 验证所有筛选参数
 */
export function validateAllFilters(params: FilterParams): ValidationResult {
  // 验证状态
  const statusValidation = validateStatus(params.status)
  if (!statusValidation.valid) {
    return statusValidation
  }

  // 验证 Token 使用量范围
  const tokensValidation = validateUsageRange(
    params.minTokens,
    params.maxTokens,
    'Token'
  )
  if (!tokensValidation.valid) {
    return tokensValidation
  }

  // 验证请求数范围
  const requestsValidation = validateUsageRange(
    params.minRequests,
    params.maxRequests,
    '请求数'
  )
  if (!requestsValidation.valid) {
    return requestsValidation
  }

  // 验证最后使用时间
  const lastUsedValidation = validateLastUsedTime(
    params.lastUsedAfter,
    params.lastUsedBefore
  )
  if (!lastUsedValidation.valid) {
    return lastUsedValidation
  }

  return { valid: true }
}
