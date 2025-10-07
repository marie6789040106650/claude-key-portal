/**
 * SessionRepository - 会话数据持久化
 * Phase 2.1 - 🟢 GREEN Phase
 *
 * 职责：
 * - 封装Session表的所有数据库操作
 * - 映射Prisma Session模型到Domain Session
 * - 使用Result模式处理错误
 * - 管理用户会话生命周期
 */

import { prisma } from '../prisma'
import { Result } from '@/lib/domain/shared/result'
import type { Session as PrismaSession } from '@prisma/client'

/**
 * Domain Session接口
 */
export interface DomainSession {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  deviceId: string | null
  deviceName: string | null
  ip: string
  userAgent: string
  location: any | null
  createdAt: Date
  expiresAt: Date
  lastActivityAt: Date
}

/**
 * 创建会话属性
 */
export interface CreateSessionProps {
  userId: string
  accessToken: string
  refreshToken: string
  ip: string
  userAgent: string
  expiresAt: Date
  deviceId?: string
  deviceName?: string
  location?: any
}

/**
 * 会话未找到错误
 */
export class SessionNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Session not found: ${identifier}`)
    this.name = 'SessionNotFoundError'
  }
}

/**
 * 会话仓储
 */
export class SessionRepository {
  /**
   * 通过ID查找会话
   */
  async findById(id: string): Promise<Result<DomainSession>> {
    try {
      const session = await prisma.session.findUnique({
        where: { id },
      })

      if (!session) {
        return Result.fail(new SessionNotFoundError(id))
      }

      return Result.ok(this.toDomain(session))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过访问令牌查找会话
   */
  async findByAccessToken(accessToken: string): Promise<Result<DomainSession>> {
    try {
      const session = await prisma.session.findUnique({
        where: { accessToken },
      })

      if (!session) {
        return Result.fail(new SessionNotFoundError(accessToken))
      }

      return Result.ok(this.toDomain(session))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过刷新令牌查找会话
   */
  async findByRefreshToken(
    refreshToken: string
  ): Promise<Result<DomainSession>> {
    try {
      const session = await prisma.session.findUnique({
        where: { refreshToken },
      })

      if (!session) {
        return Result.fail(new SessionNotFoundError(refreshToken))
      }

      return Result.ok(this.toDomain(session))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过用户ID查找所有会话
   */
  async findByUserId(userId: string): Promise<Result<DomainSession[]>> {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { lastActivityAt: 'desc' },
      })

      return Result.ok(sessions.map((session) => this.toDomain(session)))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 创建新会话
   */
  async create(props: CreateSessionProps): Promise<Result<DomainSession>> {
    try {
      const session = await prisma.session.create({
        data: {
          userId: props.userId,
          accessToken: props.accessToken,
          refreshToken: props.refreshToken,
          ip: props.ip,
          userAgent: props.userAgent,
          expiresAt: props.expiresAt,
          deviceId: props.deviceId,
          deviceName: props.deviceName,
          location: props.location,
        },
      })

      return Result.ok(this.toDomain(session))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 更新最后活动时间
   */
  async updateLastActivity(id: string): Promise<Result<DomainSession>> {
    try {
      const session = await prisma.session.update({
        where: { id },
        data: {
          lastActivityAt: new Date(),
        },
      })

      return Result.ok(this.toDomain(session))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 删除会话
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await prisma.session.delete({
        where: { id },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 删除用户的所有会话（用于登出所有设备）
   */
  async deleteByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.session.deleteMany({
        where: { userId },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 删除所有过期会话
   */
  async deleteExpired(): Promise<Result<void>> {
    try {
      await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 映射Prisma Session到Domain Session
   */
  private toDomain(prismaSession: PrismaSession): DomainSession {
    return {
      id: prismaSession.id,
      userId: prismaSession.userId,
      accessToken: prismaSession.accessToken,
      refreshToken: prismaSession.refreshToken,
      deviceId: prismaSession.deviceId,
      deviceName: prismaSession.deviceName,
      ip: prismaSession.ip,
      userAgent: prismaSession.userAgent,
      location: prismaSession.location,
      createdAt: prismaSession.createdAt,
      expiresAt: prismaSession.expiresAt,
      lastActivityAt: prismaSession.lastActivityAt,
    }
  }
}
