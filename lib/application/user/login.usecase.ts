/**
 * LoginUseCase - 用户登录用例
 * 负责编排用户登录业务流程
 *
 * TDD Phase: 🟢 GREEN
 */

import { Result } from '@/lib/domain/shared/result'
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/lib/domain/shared/errors'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { SessionRepository } from '@/lib/infrastructure/persistence/repositories/session.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'
import type { JwtService } from '@/lib/infrastructure/auth/jwt-service'

/**
 * 登录输入
 */
export interface LoginInput {
  email?: string
  phone?: string
  password: string
  ip: string
  userAgent: string
}

/**
 * 登录输出
 */
export interface LoginOutput {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string | null
    phone: string | null
    nickname: string | null
    avatar: string | null
  }
}

/**
 * 用户登录用例
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * 执行登录流程
   */
  async execute(input: LoginInput): Promise<Result<LoginOutput>> {
    try {
      // 1. 验证输入
      if (!input.email && !input.phone) {
        return Result.fail(new ValidationError('邮箱或手机号至少提供一个'))
      }

      // 2. 查找用户
      let userResult
      if (input.email) {
        userResult = await this.userRepository.findByEmail(input.email)
      } else {
        userResult = await this.userRepository.findByPhone(input.phone!)
      }

      if (!userResult.isSuccess) {
        return Result.fail(userResult.error!)
      }

      if (!userResult.value) {
        return Result.fail(new UnauthorizedError('邮箱或密码错误'))
      }

      const user = userResult.value

      // 3. 验证密码
      const passwordResult = await this.passwordService.compare(
        input.password,
        user.passwordHash
      )

      if (!passwordResult.isSuccess) {
        return Result.fail(passwordResult.error!)
      }

      if (!passwordResult.value) {
        return Result.fail(new UnauthorizedError('邮箱或密码错误'))
      }

      // 4. 检查账户状态
      const statusCheck = this.checkAccountStatus(user.status)
      if (!statusCheck.isSuccess) {
        return Result.fail(statusCheck.error!)
      }

      // 5. 生成 JWT Token
      const tokensResult = await this.jwtService.generateTokens(
        user.id,
        user.email
      )

      if (!tokensResult.isSuccess) {
        return Result.fail(tokensResult.error!)
      }

      const { accessToken, refreshToken } = tokensResult.value!

      // 6. 创建 Session
      const sessionResult = await this.sessionRepository.create({
        userId: user.id,
        accessToken,
        refreshToken,
        ip: input.ip,
        userAgent: input.userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
      })

      if (!sessionResult.isSuccess) {
        return Result.fail(sessionResult.error!)
      }

      // 7. 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id)

      // 8. 返回登录信息
      return Result.ok({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone ?? null, // 将 undefined 转换为 null
          nickname: user.nickname,
          avatar: user.avatar,
        },
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('登录失败')
      )
    }
  }

  /**
   * 检查账户状态
   */
  private checkAccountStatus(status: string): Result<void> {
    if (status === 'SUSPENDED') {
      return Result.fail(new ForbiddenError('账户已被停用，请联系管理员'))
    }

    if (status === 'DELETED') {
      return Result.fail(new UnauthorizedError('账户不存在'))
    }

    return Result.ok(undefined)
  }
}
