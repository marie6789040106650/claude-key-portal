/**
 * KeyRepository - 密钥数据持久化
 * Phase 2.1 - 🟢 GREEN Phase
 *
 * 职责：
 * - 封装ApiKey表的所有数据库操作
 * - 映射Prisma ApiKey模型到Domain Key实体
 * - 使用Result模式处理错误
 */

import { prisma } from '../prisma'
import { Result } from '@/lib/domain/shared/result'
import {
  KeyNotFoundError,
  KeyAlreadyExistsError,
} from '@/lib/domain/shared/errors'
import type {
  CreateKeyProps,
  UpdateKeyProps,
} from '@/lib/domain/key/key.types'
import { KeyStatus } from '@/lib/domain/key/key.types'
import type { ApiKey as PrismaApiKey } from '@prisma/client'

/**
 * Domain Key接口（简化版，用于Repository返回）
 */
export interface DomainKey {
  id: string
  userId: string
  crsKeyId: string
  crsKey: string
  name: string
  description: string | null
  status: KeyStatus
  totalCalls: number
  totalTokens: number
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
}

/**
 * 密钥仓储
 */
export class KeyRepository {
  /**
   * 通过ID查找密钥
   */
  async findById(id: string): Promise<Result<DomainKey>> {
    try {
      const key = await prisma.apiKey.findUnique({
        where: { id },
      })

      if (!key) {
        return Result.fail(new KeyNotFoundError(id))
      }

      return Result.ok(this.toDomain(key))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过用户ID查找所有密钥
   */
  async findByUserId(userId: string): Promise<Result<DomainKey[]>> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId },
      })

      return Result.ok(keys.map((key) => this.toDomain(key)))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 通过CRS密钥ID查找密钥
   */
  async findByCrsKeyId(crsKeyId: string): Promise<Result<DomainKey>> {
    try {
      const key = await prisma.apiKey.findUnique({
        where: { crsKeyId },
      })

      if (!key) {
        return Result.fail(new KeyNotFoundError(crsKeyId))
      }

      return Result.ok(this.toDomain(key))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 检查密钥名称是否已存在（同一用户下）
   */
  async existsByName(userId: string, name: string): Promise<Result<boolean>> {
    try {
      const key = await prisma.apiKey.findFirst({
        where: {
          userId,
          name,
        },
        select: { id: true },
      })

      return Result.ok(key !== null)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 创建新密钥
   */
  async create(props: CreateKeyProps): Promise<Result<DomainKey>> {
    try {
      const key = await prisma.apiKey.create({
        data: {
          userId: props.userId,
          crsKeyId: props.crsKeyId,
          crsKey: props.crsKey,
          name: props.name,
          description: props.description,
          expiresAt: props.expiresAt,
        },
      })

      return Result.ok(this.toDomain(key))
    } catch (error: any) {
      // 处理 Prisma 唯一性约束错误
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        if (field === 'crsKeyId' || field === 'crsKey') {
          return Result.fail(new KeyAlreadyExistsError(props.crsKeyId))
        }
      }
      return Result.fail(error as Error)
    }
  }

  /**
   * 更新密钥信息
   */
  async update(id: string, props: UpdateKeyProps): Promise<Result<DomainKey>> {
    try {
      const key = await prisma.apiKey.update({
        where: { id },
        data: props,
      })

      return Result.ok(this.toDomain(key))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 更新密钥使用统计
   */
  async updateUsageStats(
    id: string,
    stats: {
      totalCalls: number
      totalTokens: number
      lastUsedAt: Date
    }
  ): Promise<Result<DomainKey>> {
    try {
      const key = await prisma.apiKey.update({
        where: { id },
        data: {
          totalCalls: stats.totalCalls,
          totalTokens: stats.totalTokens,
          lastUsedAt: stats.lastUsedAt,
        },
      })

      return Result.ok(this.toDomain(key))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 删除密钥
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await prisma.apiKey.delete({
        where: { id },
      })

      return Result.ok()
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 获取用户的密钥总数
   */
  async countByUserId(userId: string): Promise<Result<number>> {
    try {
      const count = await prisma.apiKey.count({
        where: { userId },
      })
      return Result.ok(count)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 映射Prisma ApiKey到Domain Key
   */
  private toDomain(prismaKey: PrismaApiKey): DomainKey {
    return {
      id: prismaKey.id,
      userId: prismaKey.userId,
      crsKeyId: prismaKey.crsKeyId,
      crsKey: prismaKey.crsKey,
      name: prismaKey.name,
      description: prismaKey.description,
      status: prismaKey.status as KeyStatus,
      totalCalls: Number(prismaKey.totalCalls),
      totalTokens: Number(prismaKey.totalTokens),
      lastUsedAt: prismaKey.lastUsedAt,
      createdAt: prismaKey.createdAt,
      updatedAt: prismaKey.updatedAt,
      expiresAt: prismaKey.expiresAt,
    }
  }
}
