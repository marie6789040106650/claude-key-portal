/**
 * KeyRepository 测试
 * Phase 2.1 - 🔴 RED Phase
 * @jest-environment node
 */

import { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { KeyStatus } from '@/lib/domain/key/key.types'
import type { ApiKey as PrismaApiKey } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('KeyRepository', () => {
  let repository: KeyRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new KeyRepository()
  })

  describe('findById', () => {
    it('应该通过ID找到密钥', async () => {
      // Arrange
      const mockKeyId = 'key_123'
      const mockPrismaKey: PrismaApiKey = {
        id: mockKeyId,
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-xxxxxx',
        name: 'Test Key',
        description: 'Test description',
        tags: ['test', 'dev'],
        config: {},
        status: 'ACTIVE',
        totalCalls: BigInt(100),
        totalTokens: BigInt(5000),
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.findById(mockKeyId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBeDefined()
      expect(result.value?.id).toBe(mockKeyId)
      expect(result.value?.name).toBe('Test Key')
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { id: mockKeyId },
      })
    })

    it('当密钥不存在时应该返回失败', async () => {
      // Arrange
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await repository.findById('non_existent_id')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('密钥不存在')
    })
  })

  describe('findByUserId', () => {
    it('应该通过用户ID找到所有密钥', async () => {
      // Arrange
      const mockUserId = 'user_123'
      const mockKeys: PrismaApiKey[] = [
        {
          id: 'key_1',
          userId: mockUserId,
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-xxxxx1',
          name: 'Key 1',
          description: null,
          tags: [],
          config: {},
          status: 'ACTIVE',
          totalCalls: BigInt(10),
          totalTokens: BigInt(500),
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
        {
          id: 'key_2',
          userId: mockUserId,
          crsKeyId: 'crs_key_2',
          crsKey: 'sk-xxxxx2',
          name: 'Key 2',
          description: null,
          tags: [],
          config: {},
          status: 'ACTIVE',
          totalCalls: BigInt(20),
          totalTokens: BigInt(1000),
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const result = await repository.findByUserId(mockUserId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(2)
      expect(result.value?.[0].userId).toBe(mockUserId)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      })
    })
  })

  describe('findByCrsKeyId', () => {
    it('应该通过CRS密钥ID找到密钥', async () => {
      // Arrange
      const mockCrsKeyId = 'crs_key_123'
      const mockPrismaKey: PrismaApiKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-xxxxxx',
        name: 'Test Key',
        description: null,
        tags: [],
        config: {},
        status: 'ACTIVE',
        totalCalls: BigInt(0),
        totalTokens: BigInt(0),
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.findByCrsKeyId(mockCrsKeyId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.crsKeyId).toBe(mockCrsKeyId)
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { crsKeyId: mockCrsKeyId },
      })
    })
  })

  describe('create', () => {
    it('应该创建新密钥', async () => {
      // Arrange
      const createProps = {
        userId: 'user_123',
        crsKeyId: 'crs_key_new',
        crsKey: 'sk-yyyyyy',
        name: 'New Key',
        description: 'New key description',
      }

      const mockPrismaKey: PrismaApiKey = {
        id: 'key_new',
        userId: createProps.userId,
        crsKeyId: createProps.crsKeyId,
        crsKey: createProps.crsKey,
        name: createProps.name,
        description: createProps.description!,
        tags: [],
        config: {},
        status: 'ACTIVE',
        totalCalls: BigInt(0),
        totalTokens: BigInt(0),
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.create(createProps)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe(createProps.name)
      expect(result.value?.crsKeyId).toBe(createProps.crsKeyId)
      expect(prisma.apiKey.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('应该更新密钥信息', async () => {
      // Arrange
      const keyId = 'key_123'
      const updateProps = {
        name: 'Updated Name',
        description: 'Updated description',
      }

      const mockPrismaKey: PrismaApiKey = {
        id: keyId,
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-xxxxxx',
        name: updateProps.name,
        description: updateProps.description,
        tags: [],
        config: {},
        status: 'ACTIVE',
        totalCalls: BigInt(100),
        totalTokens: BigInt(5000),
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.update(keyId, updateProps)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe(updateProps.name)
      expect(result.value?.description).toBe(updateProps.description)
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: updateProps,
      })
    })
  })

  describe('delete', () => {
    it('应该删除密钥', async () => {
      // Arrange
      const keyId = 'key_123'

      ;(prisma.apiKey.delete as jest.Mock).mockResolvedValue({ id: keyId })

      // Act
      const result = await repository.delete(keyId)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: keyId },
      })
    })
  })

  describe('updateUsageStats', () => {
    it('应该更新密钥使用统计', async () => {
      // Arrange
      const keyId = 'key_123'
      const stats = {
        totalCalls: 150,
        totalTokens: 7500,
        lastUsedAt: new Date(),
      }

      const mockPrismaKey: PrismaApiKey = {
        id: keyId,
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-xxxxxx',
        name: 'Test Key',
        description: null,
        tags: [],
        config: {},
        status: 'ACTIVE',
        totalCalls: BigInt(stats.totalCalls),
        totalTokens: BigInt(stats.totalTokens),
        lastUsedAt: stats.lastUsedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.updateUsageStats(keyId, stats)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: {
          totalCalls: stats.totalCalls,
          totalTokens: stats.totalTokens,
          lastUsedAt: stats.lastUsedAt,
        },
      })
    })
  })

  describe('数据映射', () => {
    it('应该正确映射 Prisma ApiKey 到 Domain Key', async () => {
      // Arrange
      const mockPrismaKey: PrismaApiKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-xxxxxx',
        name: 'Test Key',
        description: 'Test description',
        tags: ['test', 'production'],
        config: { rateLimit: 100 },
        status: 'ACTIVE',
        totalCalls: BigInt(250),
        totalTokens: BigInt(12500),
        lastUsedAt: new Date('2024-01-03'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        expiresAt: new Date('2025-01-01'),
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockPrismaKey)

      // Act
      const result = await repository.findById('key_123')

      // Assert
      expect(result.isSuccess).toBe(true)
      const key = result.value!
      expect(key.id).toBe(mockPrismaKey.id)
      expect(key.userId).toBe(mockPrismaKey.userId)
      expect(key.crsKeyId).toBe(mockPrismaKey.crsKeyId)
      expect(key.name).toBe(mockPrismaKey.name)
      expect(key.status).toBe(KeyStatus.ACTIVE)
    })
  })
})
