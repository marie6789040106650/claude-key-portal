/**
 * GetKeyStatsUseCase - 密钥统计查询用例
 * 负责编排密钥统计查询业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { UnauthorizedError } from '@/lib/domain/shared/errors'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

/**
 * 统计查询输入
 */
export interface GetKeyStatsInput {
  keyId: string
  userId: string
}

/**
 * 密钥统计信息
 */
export interface KeyStats {
  totalTokens: number
  totalRequests: number
  inputTokens: number
  outputTokens: number
  cacheCreateTokens: number
  cacheReadTokens: number
  cost: number
}

/**
 * 统计查询输出
 */
export interface GetKeyStatsOutput {
  keyId: string
  keyName: string
  stats: KeyStats
}

/**
 * 密钥统计查询用例
 */
export class GetKeyStatsUseCase {
  constructor(
    private readonly keyRepository: KeyRepository,
    private readonly crsClient: any
  ) {}

  /**
   * 执行查询流程
   */
  async execute(input: GetKeyStatsInput): Promise<Result<GetKeyStatsOutput>> {
    try {
      // 1. 查找密钥并验证权限
      const keyResult = await this.keyRepository.findById(input.keyId)

      if (!keyResult.isSuccess) {
        return Result.fail(keyResult.error!)
      }

      const existingKey = keyResult.value!

      // 2. 验证用户权限
      if (existingKey.userId !== input.userId) {
        return Result.fail(new UnauthorizedError('无权限访问此密钥统计'))
      }

      // 3. 调用CRS获取统计数据
      let stats: KeyStats
      try {
        stats = await this.crsClient.getKeyStats(existingKey.crsKey)
      } catch (error) {
        return Result.fail(
          error instanceof Error ? error : new Error('获取统计数据失败')
        )
      }

      // 4. 返回统计信息
      return Result.ok({
        keyId: existingKey.id,
        keyName: existingKey.name,
        stats,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('查询统计数据失败')
      )
    }
  }
}
