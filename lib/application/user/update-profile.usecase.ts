/**
 * UpdateProfileUseCase - 用户资料更新用例
 * 负责编排用户资料更新业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { NotFoundError, ValidationError } from '@/lib/domain/shared/errors'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'

/**
 * 更新资料输入
 */
export interface UpdateProfileInput {
  userId: string
  nickname?: string
  avatar?: string
}

/**
 * 更新资料输出
 */
export interface UpdateProfileOutput {
  id: string
  email: string | null
  phone: string | null
  nickname: string | null
  avatar: string | null
  updatedAt: Date
}

/**
 * 用户资料更新用例
 */
export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 执行资料更新流程
   */
  async execute(
    input: UpdateProfileInput
  ): Promise<Result<UpdateProfileOutput>> {
    try {
      // 1. 验证输入：至少提供一个更新字段
      if (!input.nickname && !input.avatar) {
        return Result.fail(
          new ValidationError('至少提供一个要更新的字段（昵称或头像）')
        )
      }

      // 2. 验证昵称长度
      if (input.nickname && input.nickname.length > 50) {
        return Result.fail(new ValidationError('昵称不能超过50个字符'))
      }

      // 3. 检查用户是否存在
      const userResult = await this.userRepository.findById(input.userId)
      if (!userResult.isSuccess) {
        return Result.fail(userResult.error!)
      }

      if (!userResult.value) {
        return Result.fail(new NotFoundError('用户不存在'))
      }

      // 4. 构建更新数据
      const updateData: any = {}
      if (input.nickname !== undefined) {
        updateData.nickname = input.nickname
      }
      if (input.avatar !== undefined) {
        updateData.avatar = input.avatar
      }

      // 5. 更新用户资料
      const updateResult = await this.userRepository.update(
        input.userId,
        updateData
      )

      if (!updateResult.isSuccess) {
        return Result.fail(updateResult.error!)
      }

      // 6. 返回更新后的用户信息
      return Result.ok({
        id: updateResult.value!.id,
        email: updateResult.value!.email,
        phone: updateResult.value!.phone ?? null, // 将 undefined 转换为 null
        nickname: updateResult.value!.nickname,
        avatar: updateResult.value!.avatar,
        updatedAt: updateResult.value!.updatedAt,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('更新资料失败')
      )
    }
  }
}
