/**
 * RegisterUseCase - 用户注册用例
 * 负责编排用户注册业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import { ValidationError, ConflictError } from '@/lib/domain/shared/errors'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'

/**
 * 注册输入
 */
export interface RegisterInput {
  email?: string
  phone?: string
  password: string
  nickname?: string
}

/**
 * 注册输出
 */
export interface RegisterOutput {
  id: string
  email: string | null
  phone: string | null
  nickname: string | null
  createdAt: Date
}

/**
 * 用户注册用例
 */
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {}

  /**
   * 执行注册流程
   */
  async execute(input: RegisterInput): Promise<Result<RegisterOutput>> {
    try {
      // 1. 验证输入：邮箱或手机号至少提供一个
      if (!input.email && !input.phone) {
        return Result.fail(new ValidationError('邮箱或手机号至少提供一个'))
      }

      // 2. 检查用户是否已存在
      if (input.email) {
        const existsResult = await this.userRepository.existsByEmail(
          input.email
        )
        if (!existsResult.isSuccess) {
          return Result.fail(existsResult.error!)
        }

        if (existsResult.value) {
          return Result.fail(new ConflictError('该邮箱已被注册'))
        }
      }

      if (input.phone) {
        const existsResult = await this.userRepository.existsByPhone(
          input.phone
        )
        if (!existsResult.isSuccess) {
          return Result.fail(existsResult.error!)
        }

        if (existsResult.value) {
          return Result.fail(new ConflictError('该手机号已被注册'))
        }
      }

      // 3. 加密密码
      const hashResult = await this.passwordService.hash(input.password)
      if (!hashResult.isSuccess) {
        return Result.fail(hashResult.error!)
      }

      // 4. 创建用户
      const createResult = await this.userRepository.create({
        email: input.email,
        phone: input.phone,
        passwordHash: hashResult.value!,
        nickname: input.nickname,
      })

      if (!createResult.isSuccess) {
        return Result.fail(createResult.error!)
      }

      // 5. 返回用户信息（不包含密码哈希）
      return Result.ok({
        id: createResult.value!.id,
        email: createResult.value!.email,
        phone: createResult.value!.phone,
        nickname: createResult.value!.nickname,
        createdAt: createResult.value!.createdAt,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('注册失败')
      )
    }
  }
}
