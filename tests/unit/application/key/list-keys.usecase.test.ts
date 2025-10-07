/**
 * ListKeysUseCase 单元测试
 * 测试密钥列表查询业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { ListKeysUseCase } from '@/lib/application/key/list-keys.usecase'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

describe('ListKeysUseCase', () => {
  let listKeysUseCase: ListKeysUseCase
  let mockKeyRepository: KeyRepository
  let mockCrsClient: any

  beforeEach(() => {
    // Mock KeyRepository
    mockKeyRepository = {
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
    } as any

    // Mock CrsClient
    mockCrsClient = {
      listKeys: jest.fn(),
    }

    // 创建UseCase实例
    listKeysUseCase = new ListKeysUseCase(
      mockKeyRepository,
      mockCrsClient
    )
  })

  describe('execute', () => {
    it('should successfully list keys without pagination', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
      }

      const mockKeys = [
        {
          id: 'key_1',
          userId: 'user_123',
          crsKeyId: 'crs_1',
          crsKey: 'sk-ant-test1',
          name: 'Key 1',
          description: null,
          status: 'ACTIVE' as const,
          totalCalls: 10,
          totalTokens: 1000,
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
        {
          id: 'key_2',
          userId: 'user_123',
          crsKeyId: 'crs_2',
          crsKey: 'sk-ant-test2',
          name: 'Key 2',
          description: 'Test key 2',
          status: 'ACTIVE' as const,
          totalCalls: 20,
          totalTokens: 2000,
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
      ]

      ;(mockKeyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })

      ;(mockKeyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 2,
      })

      // Act
      const result = await listKeysUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.keys).toHaveLength(2)
      expect(result.value?.total).toBe(2)
      expect(mockKeyRepository.findByUserId).toHaveBeenCalledWith('user_123')
    })

    it('should validate pagination parameters', async () => {
      // Arrange - invalid page
      const input1 = {
        userId: 'user_123',
        page: 0, // 页码必须 >= 1
        limit: 10,
      }

      // Act
      const result1 = await listKeysUseCase.execute(input1)

      // Assert
      expect(result1).toBeDefined()
      expect(result1.isSuccess).toBe(false)
      expect(result1.error).toBeDefined()
      expect(result1.error?.message).toContain('page')

      // Arrange - invalid limit
      const input2 = {
        userId: 'user_123',
        page: 1,
        limit: 150, // 限制最大100
      }

      // Act
      const result2 = await listKeysUseCase.execute(input2)

      // Assert
      expect(result2).toBeDefined()
      expect(result2.isSuccess).toBe(false)
      expect(result2.error).toBeDefined()
      expect(result2.error?.message).toContain('limit')
    })

    it('should return empty list when user has no keys', async () => {
      // Arrange
      const input = {
        userId: 'user_456',
      }

      ;(mockKeyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: [],
      })

      ;(mockKeyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 0,
      })

      // Act
      const result = await listKeysUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.keys).toHaveLength(0)
      expect(result.value?.total).toBe(0)
    })

    it('should sync with CRS when requested', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        sync: true,
      }

      const mockKeys = [
        {
          id: 'key_1',
          userId: 'user_123',
          crsKeyId: 'crs_1',
          crsKey: 'sk-ant-test1',
          name: 'Key 1',
          description: null,
          status: 'ACTIVE' as const,
          totalCalls: 10,
          totalTokens: 1000,
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
      ]

      ;(mockKeyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })

      ;(mockKeyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 1,
      })

      const mockCrsKeys = [
        {
          id: 'crs_1',
          key: 'sk-ant-test1',
          name: 'Key 1',
          status: 'ACTIVE',
        },
      ]

      ;(mockCrsClient.listKeys as jest.Mock).mockResolvedValue(mockCrsKeys)

      // Act
      const result = await listKeysUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(mockCrsClient.listKeys).toHaveBeenCalledWith('user_123')
      expect(result.value?.syncedAt).toBeDefined()
    })

    it('should handle CRS sync failure gracefully', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        sync: true,
      }

      const mockKeys = [
        {
          id: 'key_1',
          userId: 'user_123',
          crsKeyId: 'crs_1',
          crsKey: 'sk-ant-test1',
          name: 'Key 1',
          description: null,
          status: 'ACTIVE' as const,
          totalCalls: 10,
          totalTokens: 1000,
          lastUsedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: null,
        },
      ]

      ;(mockKeyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })

      ;(mockKeyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 1,
      })

      ;(mockCrsClient.listKeys as jest.Mock).mockRejectedValue(
        new Error('CRS unavailable')
      )

      // Act
      const result = await listKeysUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true) // 仍然返回本地数据
      expect(result.value?.keys).toHaveLength(1)
      expect(result.value?.syncWarning).toBeDefined()
    })

    it('should handle repository errors', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
      }

      ;(mockKeyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      })

      // Act
      const result = await listKeysUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Database')
    })
  })
})
