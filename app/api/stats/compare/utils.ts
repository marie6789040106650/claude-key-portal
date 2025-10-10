/**
 * Compare Stats 工具函数
 */

/**
 * 验证密钥ID参数
 * @returns 验证结果 { valid: boolean, keyIds?: string[], error?: string }
 */
export function validateKeyIdsParam(
  keyIdsParam: string | null
): {
  valid: boolean
  keyIds?: string[]
  error?: string
} {
  if (!keyIdsParam) {
    return {
      valid: false,
      error: '缺少必需参数: keyIds',
    }
  }

  const keyIds = keyIdsParam.split(',').filter((id) => id.trim())

  if (keyIds.length < 2) {
    return {
      valid: false,
      error: '至少需要2个密钥进行对比',
    }
  }

  if (keyIds.length > 5) {
    return {
      valid: false,
      error: '最多支持5个密钥对比',
    }
  }

  return {
    valid: true,
    keyIds,
  }
}

/**
 * 密钥统计信息
 */
export interface KeyStats {
  totalTokens: number
  totalRequests: number
  inputTokens: number
  outputTokens: number
  cost: number
}

/**
 * 密钥对比数据
 */
export interface KeyCompareData {
  id: string
  name: string
  stats: KeyStats
}

/**
 * 对比结果
 */
export interface ComparisonResult {
  maxTokens: { keyId: string; keyName: string; value: number }
  maxRequests: { keyId: string; keyName: string; value: number }
  maxCost: { keyId: string; keyName: string; value: number }
  totalTokens: number
  totalRequests: number
  totalCost: number
}

/**
 * API 响应格式
 */
export interface CompareResponse {
  keys: KeyCompareData[]
  comparison: ComparisonResult
  warning?: string
}

/**
 * 计算对比数据
 */
export function calculateComparison(
  keys: KeyCompareData[]
): ComparisonResult {
  let maxTokens = { keyId: '', keyName: '', value: 0 }
  let maxRequests = { keyId: '', keyName: '', value: 0 }
  let maxCost = { keyId: '', keyName: '', value: 0 }
  let totalTokens = 0
  let totalRequests = 0
  let totalCost = 0

  keys.forEach((key) => {
    // 累加总计
    totalTokens += key.stats.totalTokens
    totalRequests += key.stats.totalRequests
    totalCost += key.stats.cost

    // 找出最大值
    if (key.stats.totalTokens > maxTokens.value) {
      maxTokens = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.totalTokens,
      }
    }

    if (key.stats.totalRequests > maxRequests.value) {
      maxRequests = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.totalRequests,
      }
    }

    if (key.stats.cost > maxCost.value) {
      maxCost = {
        keyId: key.id,
        keyName: key.name,
        value: key.stats.cost,
      }
    }
  })

  return {
    maxTokens,
    maxRequests,
    maxCost,
    totalTokens,
    totalRequests,
    totalCost,
  }
}
