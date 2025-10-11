/**
 * Key Merging Utilities
 * 密钥数据合并工具函数
 *
 * TDD Phase: 🔵 REFACTOR
 */

import type { DomainKey } from '@/lib/infrastructure/persistence/repositories/key.repository'

/**
 * CRS API Key类型（从CRS API返回的格式）
 */
export interface CrsApiKey {
  id: string
  apiKey: string
  name: string
  permissions: string[]
  monthlyLimit: number
  currentUsage: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

/**
 * 同步问题类型
 */
export interface SyncIssue {
  keyId: string
  issue: string
  local: string
  crs: string
}

/**
 * 合并结果类型
 */
export interface MergeResult {
  mergedKeys: DomainKey[]
  syncIssues: SyncIssue[]
}

/**
 * 将CRS密钥转换为Portal Domain密钥格式
 */
export function convertCrsKeyToDomainKey(
  crsKey: CrsApiKey,
  userId: string
): DomainKey {
  return {
    id: crsKey.id, // 使用CRS ID
    crsKeyId: crsKey.id,
    userId,
    name: crsKey.name,
    status: crsKey.status as any,
    isFavorite: false,
    notes: null,
    tags: [],
    createdAt: new Date(crsKey.createdAt),
    updatedAt: new Date(crsKey.updatedAt),
    // CRS特有字段
    apiKey: crsKey.apiKey,
    monthlyLimit: crsKey.monthlyLimit,
    currentUsage: crsKey.currentUsage,
    permissions: crsKey.permissions,
  } as any
}

/**
 * 检测本地密钥和CRS密钥之间的同步问题
 */
export function detectSyncIssue(
  localKey: DomainKey,
  crsKey: CrsApiKey
): SyncIssue | null {
  // 检查状态不一致（将CRS状态转换为大写以匹配KeyStatus枚举）
  const normalizedCrsStatus = crsKey.status.toUpperCase()
  const normalizedLocalStatus = String(localKey.status).toUpperCase()

  if (normalizedCrsStatus !== normalizedLocalStatus) {
    return {
      keyId: localKey.id,
      issue: 'status_mismatch',
      local: String(localKey.status),
      crs: crsKey.status,
    }
  }

  return null
}

/**
 * 合并本地Portal密钥和CRS密钥数据
 *
 * @param localKeys - Portal本地密钥列表
 * @param crsKeys - CRS API返回的密钥列表
 * @param userId - 用户ID（用于创建新的Domain Key）
 * @returns 合并后的密钥列表和同步问题列表
 */
export function mergeLocalAndCrsKeys(
  localKeys: DomainKey[],
  crsKeys: CrsApiKey[],
  userId: string
): MergeResult {
  // 创建CRS密钥Map，方便查找
  const crsKeyMap = new Map(crsKeys.map(k => [k.id, k]))

  const mergedKeys: DomainKey[] = []
  const syncIssues: SyncIssue[] = []

  // 1. 合并本地已有的密钥
  for (const localKey of localKeys) {
    const crsKey = crsKeyMap.get(localKey.crsKeyId)

    if (crsKey) {
      // 合并Portal和CRS数据
      mergedKeys.push({
        ...localKey,
        // 添加CRS字段
        apiKey: crsKey.apiKey,
        monthlyLimit: crsKey.monthlyLimit,
        currentUsage: crsKey.currentUsage,
        permissions: crsKey.permissions,
      } as any)

      // 检查同步问题
      const issue = detectSyncIssue(localKey, crsKey)
      if (issue) {
        syncIssues.push(issue)
      }

      // 从Map中移除已处理的CRS密钥
      crsKeyMap.delete(localKey.crsKeyId)
    } else {
      // CRS中不存在此密钥，保留本地数据
      mergedKeys.push(localKey)
    }
  }

  // 2. 添加CRS中存在但Portal本地不存在的密钥
  for (const [_, crsKey] of crsKeyMap) {
    mergedKeys.push(convertCrsKeyToDomainKey(crsKey, userId))
  }

  return { mergedKeys, syncIssues }
}
