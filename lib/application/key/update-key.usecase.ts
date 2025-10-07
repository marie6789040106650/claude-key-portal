/**
 * UpdateKeyUseCase - 密钥更新用例
 * 负责编排密钥更新业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '@/lib/domain/shared/errors'
import type {
  KeyRepository,
  DomainKey,
} from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'
import type { KeyStatus } from '@/lib/domain/key/key.types'

/**
 * 更新密钥输入
 */
export interface UpdateKeyInput {
  keyId: string
  userId: string
  name?: string
  description?: string
  status?: KeyStatus
  tags?: string[]
  expiresAt?: Date | null
}

/**
 * 密钥更新用例
 */
export class UpdateKeyUseCase {
  constructor(
    private readonly keyRepository: KeyRepository,
    private readonly crsClient: any
  ) {}

  /**
   * 执行更新流程
   */
  async execute(input: UpdateKeyInput): Promise<Result<DomainKey>> {
    try {
      // 1. 查找密钥并验证权限
      const keyResult = await this.keyRepository.findById(input.keyId)

      if (!keyResult.isSuccess) {
        return Result.fail(keyResult.error!)
      }

      const existingKey = keyResult.value!

      // 2. 验证用户权限
      if (existingKey.userId !== input.userId) {
        return Result.fail(new UnauthorizedError('无权限操作此密钥'))
      }

      // 3. 验证密钥状态
      if (existingKey.status === 'DELETED') {
        return Result.fail(new ValidationError('密钥已删除，无法更新'))
      }

      // 4. 检查是否有更新内容
      const hasNameUpdate = input.name && input.name !== existingKey.name
      const hasDescriptionUpdate = input.description !== undefined
      const hasStatusUpdate = input.status && input.status !== existingKey.status
      const hasTagsUpdate = input.tags !== undefined
      const hasExpiresAtUpdate = input.expiresAt !== undefined

      const hasAnyUpdate =
        hasNameUpdate ||
        hasDescriptionUpdate ||
        hasStatusUpdate ||
        hasTagsUpdate ||
        hasExpiresAtUpdate

      if (!hasAnyUpdate) {
        // 无更新内容，返回原密钥
        return Result.ok(existingKey)
      }

      // 5. 检查名称是否重复
      if (hasNameUpdate) {
        const existsResult = await this.keyRepository.existsByName(
          input.userId,
          input.name!
        )

        if (!existsResult.isSuccess) {
          return Result.fail(existsResult.error!)
        }

        if (existsResult.value) {
          return Result.fail(new ConflictError('该密钥名称已存在'))
        }
      }

      // 6. 分离CRS字段和本地字段
      const crsFields: any = {}
      const localFields: any = {}

      if (hasNameUpdate) {
        crsFields.name = input.name
      }

      if (hasDescriptionUpdate) {
        crsFields.description = input.description
      }

      if (hasStatusUpdate) {
        crsFields.status = input.status
      }

      if (hasTagsUpdate) {
        // tags是本地字段，不需要同步到CRS
        localFields.tags = input.tags
      }

      if (hasExpiresAtUpdate) {
        // expiresAt是本地字段，不需要同步到CRS
        localFields.expiresAt = input.expiresAt
      }

      const hasCrsUpdate = Object.keys(crsFields).length > 0
      const hasLocalUpdate = Object.keys(localFields).length > 0

      // 7. 更新CRS（如果有CRS字段更新）
      if (hasCrsUpdate) {
        try {
          await this.crsClient.updateKey(existingKey.crsKeyId, crsFields)
        } catch (error) {
          return Result.fail(
            error instanceof Error ? error : new Error('CRS更新失败')
          )
        }
      }

      // 8. 更新本地数据
      const updateData: any = {}

      if (hasCrsUpdate) {
        Object.assign(updateData, crsFields)
      }

      if (hasLocalUpdate) {
        Object.assign(updateData, localFields)
      }

      const updateResult = await this.keyRepository.update(
        input.keyId,
        updateData
      )

      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error!)
      }

      return Result.ok(updateResult.value!)
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('密钥更新失败')
      )
    }
  }
}
