/**
 * DeleteKeyUseCase - 密钥删除用例
 * 负责编排密钥删除业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { UnauthorizedError } from '@/lib/domain/shared/errors'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'
import { KeyStatus } from '@/lib/domain/key/key.types'

/**
 * 删除密钥输入
 */
export interface DeleteKeyInput {
  keyId: string
  userId: string
  permanent?: boolean // 是否永久删除（默认软删除）
  force?: boolean // 强制删除（CRS失败时仍删除本地）
}

/**
 * 删除密钥输出
 */
export interface DeleteKeyOutput {
  deleted: boolean
  permanent: boolean
  alreadyDeleted?: boolean
  warning?: string
}

/**
 * 密钥删除用例
 */
export class DeleteKeyUseCase {
  constructor(
    private readonly keyRepository: KeyRepository,
    private readonly crsClient: any
  ) {}

  /**
   * 执行删除流程
   */
  async execute(input: DeleteKeyInput): Promise<Result<DeleteKeyOutput>> {
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

      // 3. 检查是否已删除（幂等性）
      if (existingKey.status === KeyStatus.DELETED) {
        return Result.ok({
          deleted: true,
          permanent: false,
          alreadyDeleted: true,
        })
      }

      // 4. 删除CRS密钥
      let crsDeleteSuccess = false
      let crsDeleteWarning: string | undefined

      try {
        await this.crsClient.deleteKey(existingKey.crsKeyId)
        crsDeleteSuccess = true
      } catch (error: any) {
        // CRS密钥不存在（404），且force=true时可以继续
        if (error.statusCode === 404 && input.force) {
          crsDeleteSuccess = true
          crsDeleteWarning = 'CRS密钥不存在，已删除本地记录'
        } else if (!input.force) {
          // 非force模式下，CRS删除失败则返回错误
          return Result.fail(
            error instanceof Error ? error : new Error('CRS删除失败')
          )
        }
      }

      // 5. 删除本地记录
      const permanent = input.permanent || false

      if (permanent) {
        // 永久删除
        const deleteResult = await this.keyRepository.delete(input.keyId)

        if (!deleteResult.isSuccess) {
          return Result.fail(deleteResult.error!)
        }
      } else {
        // 软删除
        const updateResult = await this.keyRepository.update(input.keyId, {
          status: KeyStatus.DELETED,
        })

        if (!updateResult.isSuccess) {
          return Result.fail(updateResult.error!)
        }
      }

      return Result.ok({
        deleted: true,
        permanent,
        warning: crsDeleteWarning,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('密钥删除失败')
      )
    }
  }
}
