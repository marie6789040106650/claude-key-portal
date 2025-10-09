/**
 * ListKeysUseCase - 密钥列表查询用例
 * 负责编排密钥列表查询业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { ValidationError } from '@/lib/domain/shared/errors'
import type { KeyRepository, DomainKey } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

/**
 * 列表查询输入
 */
export interface ListKeysInput {
  userId: string
  page?: number
  limit?: number
  status?: string
  tag?: string
  sync?: boolean
}

/**
 * 列表查询输出
 */
export interface ListKeysOutput {
  keys: DomainKey[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
  syncedAt?: string
  syncWarning?: string
  syncIssues?: Array<{
    keyId: string
    issue: string
    local: string
    crs: string
  }>
}

/**
 * 密钥列表查询用例
 */
export class ListKeysUseCase {
  constructor(
    private readonly keyRepository: KeyRepository,
    private readonly crsClient: any
  ) {}

  /**
   * 执行查询流程
   */
  async execute(input: ListKeysInput): Promise<Result<ListKeysOutput>> {
    try {
      // 1. 验证分页参数
      const page = input.page ?? 1
      const limit = input.limit ?? 10

      if (page < 1) {
        return Result.fail(new ValidationError('page必须大于0'))
      }

      if (limit < 1 || limit > 100) {
        return Result.fail(new ValidationError('limit必须在1-100之间'))
      }

      // 2. 查询密钥列表
      const keysResult = await this.keyRepository.findByUserId(input.userId)

      if (!keysResult.isSuccess) {
        return Result.fail(keysResult.error!)
      }

      // 3. 查询总数
      const countResult = await this.keyRepository.countByUserId(input.userId)

      if (!countResult.isSuccess) {
        return Result.fail(countResult.error!)
      }

      const keys = keysResult.value!
      const total = countResult.value!

      // 4. 构建基础响应
      const response: ListKeysOutput = {
        keys,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }

      // 5. CRS同步（可选）
      if (input.sync) {
        try {
          // 调用CRS getApiKeys获取完整密钥数据
          const crsKeys = await this.crsClient.getApiKeys()
          response.syncedAt = new Date().toISOString()

          // 创建一个Map存储CRS密钥，方便查找
          const crsKeyMap = new Map(crsKeys.map(k => [k.id, k]))

          // 合并本地密钥和CRS数据
          const mergedKeys: DomainKey[] = []
          const syncIssues: any[] = []

          // 1. 合并本地已有的密钥
          for (const localKey of keys) {
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

              // 检查状态不一致
              if (crsKey.status !== localKey.status) {
                syncIssues.push({
                  keyId: localKey.id,
                  issue: 'status_mismatch',
                  local: localKey.status,
                  crs: crsKey.status,
                })
              }

              // 从Map中移除已处理的CRS密钥
              crsKeyMap.delete(localKey.crsKeyId)
            } else {
              // CRS中不存在此密钥
              mergedKeys.push(localKey)
            }
          }

          // 2. 添加CRS中存在但Portal本地不存在的密钥
          for (const [crsKeyId, crsKey] of crsKeyMap) {
            mergedKeys.push({
              id: crsKey.id, // 使用CRS ID
              crsKeyId: crsKey.id,
              userId: input.userId,
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
            } as any)
          }

          // 更新响应数据
          response.keys = mergedKeys
          response.total = mergedKeys.length
          response.totalPages = Math.ceil(mergedKeys.length / limit)

          if (syncIssues.length > 0) {
            response.syncIssues = syncIssues
          }
        } catch (error) {
          // CRS同步失败不影响返回本地数据
          response.syncWarning = 'CRS同步失败，显示本地数据'
        }
      }

      return Result.ok(response)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('查询密钥列表失败')
      )
    }
  }
}
