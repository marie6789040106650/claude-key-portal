/**
 * UserRepository 测试
 * Phase 2.1 - 🔴 RED Phase
 * @jest-environment node
 */

import { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { UserStatus } from '@/lib/domain/user/user.types'
import type { User as PrismaUser } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('UserRepository', () => {
  let repository: UserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new UserRepository()
  })

  describe('findById', () => {
    it('应该通过ID找到用户', async () => {
      // Arrange
      const mockUserId = 'user_123'
      const mockPrismaUser: PrismaUser = {
        id: mockUserId,
        email: 'test@example.com',
        phone: null,
        passwordHash: 'hashed_password',
        nickname: 'Test User',
        avatar: null,
        bio: null,
        crsAdminToken: null,
        preferences: {},
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        invitedBy: null,
        inviteCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        notificationConfigId: null,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser)

      // Act
      const result = await repository.findById(mockUserId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBeDefined()
      expect(result.value?.id).toBe(mockUserId)
      expect(result.value?.email).toBe('test@example.com')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      })
    })

    it('当用户不存在时应该返回失败', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await repository.findById('non_existent_id')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('用户不存在')
    })

    it('当数据库错误时应该返回失败', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      // Act
      const result = await repository.findById('user_123')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Database error')
    })
  })

  describe('findByEmail', () => {
    it('应该通过邮箱找到用户', async () => {
      // Arrange
      const mockEmail = 'test@example.com'
      const mockPrismaUser: PrismaUser = {
        id: 'user_123',
        email: mockEmail,
        phone: null,
        passwordHash: 'hashed_password',
        nickname: 'Test User',
        avatar: null,
        bio: null,
        crsAdminToken: null,
        preferences: {},
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        invitedBy: null,
        inviteCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        notificationConfigId: null,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser)

      // Act
      const result = await repository.findByEmail(mockEmail)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.email).toBe(mockEmail)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      })
    })
  })

  describe('create', () => {
    it('应该创建新用户', async () => {
      // Arrange
      const createProps = {
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        nickname: 'New User',
      }

      const mockPrismaUser: PrismaUser = {
        id: 'user_new',
        email: createProps.email!,
        phone: null,
        passwordHash: createProps.passwordHash,
        nickname: createProps.nickname!,
        avatar: null,
        bio: null,
        crsAdminToken: null,
        preferences: {},
        status: 'ACTIVE',
        emailVerified: false,
        phoneVerified: false,
        invitedBy: null,
        inviteCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        notificationConfigId: null,
      }

      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockPrismaUser)

      // Act
      const result = await repository.create(createProps)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.email).toBe(createProps.email)
      expect(result.value?.nickname).toBe(createProps.nickname)
      expect(prisma.user.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应该更新用户信息', async () => {
      // Arrange
      const userId = 'user_123'
      const updateProps = {
        nickname: 'Updated Name',
      }

      const mockPrismaUser: PrismaUser = {
        id: userId,
        email: 'test@example.com',
        phone: null,
        passwordHash: 'hashed_password',
        nickname: updateProps.nickname,
        avatar: null,
        bio: null,
        crsAdminToken: null,
        preferences: {},
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        invitedBy: null,
        inviteCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        notificationConfigId: null,
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockPrismaUser)

      // Act
      const result = await repository.update(userId, updateProps)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.nickname).toBe(updateProps.nickname)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateProps,
      })
    })
  })

  describe('delete', () => {
    it('应该删除用户', async () => {
      // Arrange
      const userId = 'user_123'

      ;(prisma.user.delete as jest.Mock).mockResolvedValue({ id: userId })

      // Act
      const result = await repository.delete(userId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })
  })

  describe('数据映射', () => {
    it('应该正确映射 Prisma User 到 Domain User', async () => {
      // Arrange
      const mockPrismaUser: PrismaUser = {
        id: 'user_123',
        email: 'test@example.com',
        phone: null,
        passwordHash: 'hashed_password',
        nickname: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        crsAdminToken: null,
        preferences: { theme: 'dark' },
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        invitedBy: null,
        inviteCode: 'INV123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastLoginAt: new Date('2024-01-03'),
        notificationConfigId: null,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser)

      // Act
      const result = await repository.findById('user_123')

      // Assert
      expect(result.isSuccess).toBe(true)
      const user = result.value!
      expect(user.id).toBe(mockPrismaUser.id)
      expect(user.email).toBe(mockPrismaUser.email)
      expect(user.passwordHash).toBe(mockPrismaUser.passwordHash)
      expect(user.nickname).toBe(mockPrismaUser.nickname)
      expect(user.status).toBe(UserStatus.ACTIVE)
    })
  })
})
