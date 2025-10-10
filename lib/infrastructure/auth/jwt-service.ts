/**
 * JwtService - JWT Token 生成和验证服务
 * Phase 2.2 - 🟢 GREEN Phase
 *
 * 职责：
 * - 生成JWT access token和refresh token
 * - 验证JWT token
 * - 解码JWT token（无验证）
 * - 使用Result模式处理错误
 */

import jwt, { SignOptions } from 'jsonwebtoken'
import { Result } from '@/lib/domain/shared/result'

/**
 * JWT Payload 接口
 */
export interface JwtPayload {
  userId: string
  email: string | null
  type?: 'access' | 'refresh'
  [key: string]: any
}

/**
 * Token对
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * JWT服务
 */
export class JwtService {
  private readonly defaultAccessExpiry = '24h'
  private readonly defaultRefreshExpiry = '7d'
  private readonly secret: string

  /**
   * 构造函数 - 在初始化时验证JWT_SECRET配置
   * @throws {Error} 如果JWT_SECRET未配置
   */
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET未配置')
    }
    this.secret = process.env.JWT_SECRET
  }

  /**
   * 获取JWT密钥
   */
  private getSecret(): string {
    return this.secret
  }

  /**
   * 签名生成JWT token
   * @param payload - Token载荷
   * @param expiresIn - 过期时间（可选，默认24h）
   * @returns Result包装的token字符串
   */
  async sign(
    payload: JwtPayload | any,
    expiresIn: string | number = this.defaultAccessExpiry
  ): Promise<Result<string>> {
    try {
      // 验证输入
      if (!payload) {
        return Result.fail(new Error('Payload不能为空'))
      }

      // 生成token
      // @ts-expect-error - jsonwebtoken类型定义问题，运行时正常
      const token = jwt.sign(payload, this.getSecret(), { expiresIn })

      return Result.ok(token)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 验证JWT token
   * @param token - JWT token字符串
   * @returns Result包装的解码后的payload
   */
  async verify(token: string): Promise<Result<JwtPayload>> {
    try {
      // 验证输入
      if (!token || token.trim() === '') {
        return Result.fail(new Error('Token不能为空'))
      }

      // 验证token
      const payload = jwt.verify(token, this.getSecret()) as JwtPayload

      return Result.ok(payload)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 解码JWT token（无验证）
   * @param token - JWT token字符串
   * @returns Result包装的解码后的payload
   */
  async decode(token: string): Promise<Result<JwtPayload>> {
    try {
      // 使用verify但捕获错误，只返回payload
      const payload = jwt.verify(token, this.getSecret(), {
        ignoreExpiration: false,
      }) as JwtPayload

      return Result.ok(payload)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 生成access和refresh token对
   * @param userId - 用户ID
   * @param email - 用户邮箱
   * @returns Result包装的token对
   */
  async generateTokens(
    userId: string,
    email: string | null
  ): Promise<Result<TokenPair>> {
    try {
      // 生成access token
      const accessPayload: JwtPayload = {
        userId,
        email,
        type: 'access',
      }
      const accessToken = jwt.sign(accessPayload, this.getSecret(), {
        expiresIn: this.defaultAccessExpiry,
      })

      // 生成refresh token
      const refreshPayload: JwtPayload = {
        userId,
        email,
        type: 'refresh',
      }
      const refreshToken = jwt.sign(refreshPayload, this.getSecret(), {
        expiresIn: this.defaultRefreshExpiry,
      })

      return Result.ok({
        accessToken,
        refreshToken,
      })
    } catch (error) {
      return Result.fail(error as Error)
    }
  }
}
