/**
 * GetKeyStatsUseCase 单元测试
 * 测试密钥统计查询业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { GetKeyStatsUseCase } from '@/lib/application/key/get-key-stats.usecase'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

describe('GetKeyStatsUseCase', () => {
  let getKeyStatsUseCase: GetKeyStatsUseCase
  let mockKeyRepository: KeyRepository
  let mockCrsClient: any

  beforeEach(() => {
    // Mock KeyRepository
    mockKeyRepository = {
      findById: jest.fn(),
    } as any

    // Mock CrsClient
    mockCrsClient = {
      getKeyStats: jest.fn(),
    }

    // 创建UseCase实例
    getKeyStatsUseCase = new GetKeyStatsUseCase(
      mockKeyRepository,
      mockCrsClient
    )
  })

  describe('execute', () => {
    it('should successfully get key stats from CRS', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: 'ACTIVE' as const,
        totalCalls: 10,
        totalTokens: 1000,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: existingKey,
      })

      const mockStats = {
        totalTokens: 5000,
        totalRequests: 50,
        inputTokens: 3000,
        outputTokens: 2000,
        cacheCreateTokens: 100,
        cacheReadTokens: 200,
        cost: 0.25,
      }

      ;(mockCrsClient.getKeyStats as jest.Mock).mockResolvedValue(mockStats)

      // Act
      const result = await getKeyStatsUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toMatchObject({
        keyId: 'key_123',
        keyName: 'Test Key',
        stats: mockStats,
      })
      expect(mockCrsClient.getKeyStats).toHaveBeenCalledWith('sk-ant-test123')
    })

    it('should fail when key not found', async () => {
      // Arrange
      const input = {
        keyId: 'non_existent',
        userId: 'user_123',
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Key not found'),
      })

      // Act
      const result = await getKeyStatsUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('not found')
      expect(mockCrsClient.getKeyStats).not.toHaveBeenCalled()
    })

    it('should fail when user does not own the key', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'wrong_user',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123', // 不同的用户
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: 'ACTIVE' as const,
        totalCalls: 10,
        totalTokens: 1000,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: existingKey,
      })

      // Act
      const result = await getKeyStatsUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('权限')
      expect(mockCrsClient.getKeyStats).not.toHaveBeenCalled()
    })

    it('should handle CRS stats retrieval failure', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: 'ACTIVE' as const,
        totalCalls: 10,
        totalTokens: 1000,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: existingKey,
      })

      ;(mockCrsClient.getKeyStats as jest.Mock).mockRejectedValue(
        new Error('CRS stats service unavailable')
      )

      // Act
      const result = await getKeyStatsUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('CRS')
    })

    it('should return zero stats when CRS returns empty data', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: 'ACTIVE' as const,
        totalCalls: 0,
        totalTokens: 0,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: existingKey,
      })

      const mockStats = {
        totalTokens: 0,
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0,
      }

      ;(mockCrsClient.getKeyStats as jest.Mock).mockResolvedValue(mockStats)

      // Act
      const result = await getKeyStatsUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.stats.totalTokens).toBe(0)
      expect(result.value?.stats.totalRequests).toBe(0)
    })
  })
})
