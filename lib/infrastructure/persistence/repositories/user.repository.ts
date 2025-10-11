/**
 * UserRepository - 用户数据持久化
 * Phase 2.1 - 🟢 GREEN Phase
 *
 * 职责：
 * - 封装User表的所有数据库操作
 * - 映射Prisma User模型到Domain User实体
 * - 使用Result模式处理错误
 */

import { prisma } from '../prisma'
import { Result } from '@/lib/domain/shared/result'
import {
  UserNotFoundError,
  UserAlreadyExistsError,
} from '@/lib/domain/shared/errors'
import type {
  CreateUserProps,
  UpdateUserProps,
} from '@/lib/domain/user/user.types'
import { UserStatus } from '@/lib/domain/user/user.types'
import type { User as PrismaUser } from '@prisma/client'

/**
 * Domain User接口（简化版，用于Repository返回）
 */
export interface DomainUser {
  id: string
  email: string | null
  phone?: string | null  // 可选字段（数据库中暂未实现）
  passwordHash: string
  nickname: string | null
  avatar: string | null
  bio: string | null
  status: UserStatus
  emailVerified?: boolean  // 可选字段（数据库中暂未实现）
  phoneVerified?: boolean  // 可选字段（数据库中暂未实现）
  lastLoginAt?: Date | null  // 可选字段（数据库中暂未实现）
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户仓储
 */
export class UserRepository {
  /**
   * 通过ID查找用户
   */
  async findById(id: string): Promise<Result<DomainUser>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      })

      if (!user) {
        return Result.fail(new UserNotFoundError(id))
      }

      return Result.ok(this.toDomain(user))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过邮箱查找用户
   */
  async findByEmail(email: string): Promise<Result<DomainUser>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return Result.fail(new UserNotFoundError(email))
      }

      return Result.ok(this.toDomain(user))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过手机号查找用户
   *
   * @deprecated 数据库模型中暂未包含 phone 字段，此功能暂不可用
   */
  async findByPhone(phone: string): Promise<Result<DomainUser>> {
    // 注意：当前数据库 schema 中没有 phone 字段
    // 如需启用手机号登录，请先在 schema.prisma 中添加 phone 字段并执行迁移
    return Result.fail(new Error('Phone login is not yet implemented. Please use email to login.'))
  }

  /**
   * 检查邮箱是否已存在
   */
  async existsByEmail(email: string): Promise<Result<boolean>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      return Result.ok(user !== null)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 检查手机号是否已存在
   *
   * @deprecated 数据库模型中暂未包含 phone 字段，此功能暂不可用
   */
  async existsByPhone(phone: string): Promise<Result<boolean>> {
    // 注意：当前数据库 schema 中没有 phone 字段
    // 始终返回 false（不存在）
    return Result.ok(false)
  }

  /**
   * 创建新用户
   */
  async create(props: CreateUserProps): Promise<Result<DomainUser>> {
    try {
      // 验证必需字段
      if (!props.email) {
        return Result.fail(new Error('Email is required for user creation'))
      }

      const user = await prisma.user.create({
        data: {
          email: props.email,
          // phone: props.phone, // 数据库 schema 中暂未包含 phone 字段
          passwordHash: props.passwordHash,
          nickname: props.nickname,
        },
      })

      return Result.ok(this.toDomain(user))
    } catch (error: any) {
      // 处理 Prisma 唯一性约束错误
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'email'
        if (field === 'email' && props.email) {
          return Result.fail(new UserAlreadyExistsError(props.email))
        }
      }
      return Result.fail(error as Error)
    }
  }

  /**
   * 更新用户信息
   */
  async update(
    id: string,
    props: UpdateUserProps
  ): Promise<Result<DomainUser>> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: props,
      })

      return Result.ok(this.toDomain(user))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(id: string): Promise<Result<void>> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await prisma.user.delete({
        where: { id },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 获取用户总数
   */
  async count(): Promise<Result<number>> {
    try {
      const count = await prisma.user.count()
      return Result.ok(count)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 映射Prisma User到Domain User
   */
  private toDomain(prismaUser: PrismaUser): DomainUser {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      // phone: prismaUser.phone, // 数据库 schema 中暂未包含 phone 字段
      passwordHash: prismaUser.passwordHash,
      nickname: prismaUser.nickname,
      avatar: prismaUser.avatar,
      bio: prismaUser.bio,
      status: prismaUser.status as UserStatus,
      // emailVerified: prismaUser.emailVerified, // 数据库 schema 中暂未包含字段
      // phoneVerified: prismaUser.phoneVerified, // 数据库 schema 中暂未包含字段
      // lastLoginAt: prismaUser.lastLoginAt, // 数据库 schema 中暂未包含字段
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }
  }
}
