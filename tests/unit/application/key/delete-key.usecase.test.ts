/**
 * DeleteKeyUseCase 单元测试
 * 测试密钥删除业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { DeleteKeyUseCase } from '@/lib/application/key/delete-key.usecase'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

describe('DeleteKeyUseCase', () => {
  let deleteKeyUseCase: DeleteKeyUseCase
  let mockKeyRepository: KeyRepository
  let mockCrsClient: any

  beforeEach(() => {
    // Mock KeyRepository
    mockKeyRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any

    // Mock CrsClient
    mockCrsClient = {
      deleteKey: jest.fn(),
    }

    // 创建UseCase实例
    deleteKeyUseCase = new DeleteKeyUseCase(
      mockKeyRepository,
      mockCrsClient
    )
  })

  describe('execute', () => {
    it('should successfully soft delete a key', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        permanent: false,
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

      ;(mockCrsClient.deleteKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const deletedKey = {
        ...existingKey,
        status: 'DELETED' as const,
      }

      ;(mockKeyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: deletedKey,
      })

      // Act
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.deleted).toBe(true)
      expect(result.value?.permanent).toBe(false)
      expect(mockCrsClient.deleteKey).toHaveBeenCalledWith('crs_123')
      expect(mockKeyRepository.update).toHaveBeenCalledWith('key_123', {
        status: 'DELETED',
      })
      expect(mockKeyRepository.delete).not.toHaveBeenCalled()
    })

    it('should successfully permanently delete a key', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        permanent: true,
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

      ;(mockCrsClient.deleteKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      ;(mockKeyRepository.delete as jest.Mock).mockResolvedValue({
        isSuccess: true,
      })

      // Act
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.deleted).toBe(true)
      expect(result.value?.permanent).toBe(true)
      expect(mockCrsClient.deleteKey).toHaveBeenCalledWith('crs_123')
      expect(mockKeyRepository.delete).toHaveBeenCalledWith('key_123')
      expect(mockKeyRepository.update).not.toHaveBeenCalled()
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
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('not found')
      expect(mockCrsClient.deleteKey).not.toHaveBeenCalled()
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
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('权限')
      expect(mockCrsClient.deleteKey).not.toHaveBeenCalled()
    })

    it('should be idempotent when key already deleted', async () => {
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
        status: 'DELETED' as const, // 已删除
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
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.deleted).toBe(true)
      expect(result.value?.alreadyDeleted).toBe(true)
      expect(mockCrsClient.deleteKey).not.toHaveBeenCalled()
      expect(mockKeyRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle CRS deletion failure without force flag', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        force: false,
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

      ;(mockCrsClient.deleteKey as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      // Act
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('CRS')
      expect(mockKeyRepository.delete).not.toHaveBeenCalled()
    })

    it('should force delete local record when CRS key not found', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        force: true,
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

      const crsError: any = new Error('Not found')
      crsError.statusCode = 404
      ;(mockCrsClient.deleteKey as jest.Mock).mockRejectedValue(crsError)

      const deletedKey = {
        ...existingKey,
        status: 'DELETED' as const,
      }

      ;(mockKeyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: deletedKey,
      })

      // Act
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.deleted).toBe(true)
      expect(result.value?.warning).toBeDefined()
      expect(mockKeyRepository.update).toHaveBeenCalled()
    })

    it('should fail when local deletion fails', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        permanent: true,
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

      ;(mockCrsClient.deleteKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      ;(mockKeyRepository.delete as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      })

      // Act
      const result = await deleteKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Database')
    })
  })
})
