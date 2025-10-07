/**
 * CreateKeyUseCase - 密钥创建用例
 * 负责编排密钥创建业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { ValidationError, ConflictError } from '@/lib/domain/shared/errors'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

/**
 * 创建密钥输入
 */
export interface CreateKeyInput {
  userId: string
  name: string
  description?: string
  tags?: string[]
}

/**
 * 创建密钥输出
 */
export interface CreateKeyOutput {
  id: string
  userId: string
  crsKeyId: string
  crsKey: string // 完整密钥值（仅在创建时返回）
  name: string
  description: string | null
  status: string
  totalCalls: number
  totalTokens: number
  createdAt: Date
}

/**
 * 密钥创建用例
 */
export class CreateKeyUseCase {
  constructor(
    private readonly keyRepository: KeyRepository,
    private readonly crsClient: any // 使用any因为CrsClient是类实例，不是类型
  ) {}

  /**
   * 执行创建流程
   */
  async execute(input: CreateKeyInput): Promise<Result<CreateKeyOutput>> {
    try {
      // 1. 验证输入
      if (!input.name || input.name.trim().length === 0) {
        return Result.fail(new ValidationError('密钥名称不能为空'))
      }

      if (input.name.length > 100) {
        return Result.fail(new ValidationError('密钥名称不能超过100个字符'))
      }

      // 2. 检查名称是否重复
      const existsResult = await this.keyRepository.existsByName(
        input.userId,
        input.name
      )

      if (!existsResult.isSuccess) {
        return Result.fail(existsResult.error!)
      }

      if (existsResult.value) {
        return Result.fail(new ConflictError('该密钥名称已存在'))
      }

      // 3. 调用CRS创建密钥
      let crsKey: any
      try {
        crsKey = await this.crsClient.createKey({
          name: input.name,
          description: input.description,
        })
      } catch (error) {
        return Result.fail(
          error instanceof Error ? error : new Error('CRS密钥创建失败')
        )
      }

      // 4. 创建本地映射
      const createResult = await this.keyRepository.create({
        userId: input.userId,
        crsKeyId: crsKey.id,
        crsKey: crsKey.key,
        name: input.name,
        description: input.description || null,
      })

      if (!createResult.isSuccess) {
        return Result.fail(createResult.error!)
      }

      // 5. 返回密钥信息
      const key = createResult.value!
      return Result.ok({
        id: key.id,
        userId: key.userId,
        crsKeyId: key.crsKeyId,
        crsKey: key.crsKey, // 创建时返回完整密钥
        name: key.name,
        description: key.description,
        status: key.status,
        totalCalls: key.totalCalls,
        totalTokens: key.totalTokens,
        createdAt: key.createdAt,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('密钥创建失败')
      )
    }
  }
}
