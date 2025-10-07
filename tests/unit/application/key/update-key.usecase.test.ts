/**
 * UpdateKeyUseCase 单元测试
 * 测试密钥更新业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { UpdateKeyUseCase } from '@/lib/application/key/update-key.usecase'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'
import { KeyStatus } from '@/lib/domain/key/key.types'

describe('UpdateKeyUseCase', () => {
  let updateKeyUseCase: UpdateKeyUseCase
  let mockKeyRepository: KeyRepository
  let mockCrsClient: any

  beforeEach(() => {
    // Mock KeyRepository
    mockKeyRepository = {
      findById: jest.fn(),
      existsByName: jest.fn(),
      update: jest.fn(),
    } as any

    // Mock CrsClient
    mockCrsClient = {
      updateKey: jest.fn(),
    }

    // 创建UseCase实例
    updateKeyUseCase = new UpdateKeyUseCase(
      mockKeyRepository,
      mockCrsClient
    )
  })

  describe('execute', () => {
    it('should successfully update key with local fields only', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        tags: ['updated', 'test'],
        expiresAt: new Date('2025-12-31'),
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: KeyStatus.ACTIVE,
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

      const updatedKey = { ...existingKey, expiresAt: input.expiresAt }

      ;(mockKeyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: updatedKey,
      })

      // Act
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.expiresAt).toEqual(input.expiresAt)
      expect(mockCrsClient.updateKey).not.toHaveBeenCalled() // 仅本地字段，不调用CRS
      expect(mockKeyRepository.update).toHaveBeenCalled()
    })

    it('should successfully update key with CRS fields', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        name: 'Updated Name',
        description: 'Updated Description',
        status: KeyStatus.INACTIVE,
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: KeyStatus.ACTIVE,
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

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false, // 新名称不存在
      })

      ;(mockCrsClient.updateKey as jest.Mock).mockResolvedValue({
        success: true,
      })

      const updatedKey = {
        ...existingKey,
        name: 'Updated Name',
        description: 'Updated Description',
        status: KeyStatus.INACTIVE,
      }

      ;(mockKeyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: updatedKey,
      })

      // Act
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe('Updated Name')
      expect(mockCrsClient.updateKey).toHaveBeenCalledWith('crs_123', {
        name: 'Updated Name',
        description: 'Updated Description',
        status: KeyStatus.INACTIVE,
      })
    })

    it('should fail when key not found', async () => {
      // Arrange
      const input = {
        keyId: 'non_existent',
        userId: 'user_123',
        name: 'New Name',
      }

      ;(mockKeyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Key not found'),
      })

      // Act
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('not found')
      expect(mockCrsClient.updateKey).not.toHaveBeenCalled()
    })

    it('should fail when user does not own the key', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'wrong_user',
        name: 'New Name',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123', // 不同的用户
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: KeyStatus.ACTIVE,
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
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('权限')
      expect(mockCrsClient.updateKey).not.toHaveBeenCalled()
    })

    it('should fail when key is deleted', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        name: 'New Name',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: 'DELETED' as const,
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
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('已删除')
    })

    it('should fail when new name already exists', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        name: 'Existing Name',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: KeyStatus.ACTIVE,
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

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true, // 名称已存在
      })

      // Act
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('已存在')
    })

    it('should fail when CRS update fails', async () => {
      // Arrange
      const input = {
        keyId: 'key_123',
        userId: 'user_123',
        name: 'Updated Name',
      }

      const existingKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_123',
        crsKey: 'sk-ant-test123',
        name: 'Test Key',
        description: null,
        status: KeyStatus.ACTIVE,
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

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false,
      })

      ;(mockCrsClient.updateKey as jest.Mock).mockRejectedValue(
        new Error('CRS update failed')
      )

      // Act
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('CRS')
      expect(mockKeyRepository.update).not.toHaveBeenCalled()
    })

    it('should return existing key when no fields to update', async () => {
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
        status: KeyStatus.ACTIVE,
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
      const result = await updateKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(existingKey)
      expect(mockCrsClient.updateKey).not.toHaveBeenCalled()
      expect(mockKeyRepository.update).not.toHaveBeenCalled()
    })
  })
})
