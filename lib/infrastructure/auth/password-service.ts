/**
 * PasswordService - 密码加密和验证服务
 * Phase 2.2 - 🟢 GREEN Phase
 *
 * 职责：
 * - 使用bcrypt加密密码
 * - 验证密码是否匹配
 * - 使用Result模式处理错误
 */

import bcrypt from 'bcryptjs'
import { Result } from '@/lib/domain/shared/result'

/**
 * 密码服务
 */
export class PasswordService {
  private readonly defaultSaltRounds = 10

  /**
   * 加密密码
   * @param plainPassword - 明文密码
   * @param saltRounds - Salt轮数（可选，默认10）
   * @returns Result包装的加密后密码
   */
  async hash(
    plainPassword: string,
    saltRounds: number = this.defaultSaltRounds
  ): Promise<Result<string>> {
    try {
      // 验证输入
      if (!plainPassword || plainPassword.trim() === '') {
        return Result.fail(new Error('密码不能为空'))
      }

      // 使用bcrypt加密
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

      return Result.ok(hashedPassword)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 验证密码
   * @param plainPassword - 明文密码
   * @param hashedPassword - 加密后的密码
   * @returns Result包装的验证结果（true/false）
   */
  async compare(
    plainPassword: string,
    hashedPassword: string
  ): Promise<Result<boolean>> {
    try {
      // 验证输入
      if (!plainPassword || plainPassword.trim() === '') {
        return Result.fail(new Error('密码不能为空'))
      }

      if (!hashedPassword || hashedPassword.trim() === '') {
        return Result.fail(new Error('哈希值不能为空'))
      }

      // 使用bcrypt比较
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword)

      return Result.ok(isMatch)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * verify - compare的别名，提供更语义化的API
   */
  async verify(
    plainPassword: string,
    hashedPassword: string
  ): Promise<Result<boolean>> {
    return this.compare(plainPassword, hashedPassword)
  }
}
