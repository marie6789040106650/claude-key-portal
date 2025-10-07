/**
 * UpdatePasswordUseCase - 用户密码更新用例
 * 负责编排用户密码更新业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/domain/shared/errors'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'

/**
 * 更新密码输入
 */
export interface UpdatePasswordInput {
  userId: string
  currentPassword: string
  newPassword: string
}

/**
 * 更新密码输出
 */
export interface UpdatePasswordOutput {
  success: true
}

/**
 * 用户密码更新用例
 */
export class UpdatePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * 执行密码更新流程
   */
  async execute(
    input: UpdatePasswordInput
  ): Promise<Result<UpdatePasswordOutput>> {
    try {
      // 1. 检查用户是否存在
      const userResult = await this.userRepository.findById(input.userId)
      if (!userResult.isSuccess) {
        return Result.fail(userResult.error!)
      }

      if (!userResult.value) {
        return Result.fail(new NotFoundError('用户不存在'))
      }

      const user = userResult.value

      // 2. 验证当前密码
      const passwordResult = await this.passwordService.compare(
        input.currentPassword,
        user.passwordHash
      )

      if (!passwordResult.isSuccess) {
        return Result.fail(passwordResult.error!)
      }

      if (!passwordResult.value) {
        return Result.fail(new UnauthorizedError('当前密码错误'))
      }

      // 3. 检查新密码是否与当前密码相同
      if (input.currentPassword === input.newPassword) {
        return Result.fail(
          new ValidationError('新密码不能与当前密码相同')
        )
      }

      // 4. 加密新密码
      const hashResult = await this.passwordService.hash(input.newPassword)
      if (!hashResult.isSuccess) {
        return Result.fail(hashResult.error!)
      }

      // 5. 更新密码
      const updateResult = await this.userRepository.update(input.userId, {
        passwordHash: hashResult.value!,
      })

      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error!)
      }

      // 6. 返回成功
      return Result.ok({ success: true })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('更新密码失败')
      )
    }
  }
}
