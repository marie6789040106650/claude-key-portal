/**
 * CreateKeyUseCase 单元测试
 * 测试密钥创建业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { CreateKeyUseCase } from '@/lib/application/key/create-key.usecase'
import type { KeyRepository } from '@/lib/infrastructure/persistence/repositories/key.repository'
import type { CrsClient } from '@/lib/infrastructure/external/crs-client'

describe('CreateKeyUseCase', () => {
  let createKeyUseCase: CreateKeyUseCase
  let mockKeyRepository: KeyRepository
  let mockCrsClient: any

  beforeEach(() => {
    // Mock KeyRepository
    mockKeyRepository = {
      existsByName: jest.fn(),
      create: jest.fn(),
    } as any

    // Mock CrsClient
    mockCrsClient = {
      createKey: jest.fn(),
    }

    // 创建UseCase实例
    createKeyUseCase = new CreateKeyUseCase(
      mockKeyRepository,
      mockCrsClient
    )
  })

  describe('execute', () => {
    it('should successfully create a new key', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Test Key',
        description: 'Test Description',
        tags: ['test', 'dev'],
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false, // 名称不存在
      })

      const mockCrsKey = {
        id: 'crs_key_123',
        key: 'sk-ant-test123456',
        name: 'Test Key',
        description: 'Test Description',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      ;(mockCrsClient.createKey as jest.Mock).mockResolvedValue(mockCrsKey)

      const mockLocalKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-ant-test123456',
        name: 'Test Key',
        description: 'Test Description',
        status: 'ACTIVE',
        totalCalls: 0,
        totalTokens: 0,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockLocalKey,
      })

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toMatchObject({
        id: 'key_123',
        name: 'Test Key',
        crsKey: 'sk-ant-test123456',
      })
      expect(mockKeyRepository.existsByName).toHaveBeenCalledWith('user_123', 'Test Key')
      expect(mockCrsClient.createKey).toHaveBeenCalledWith({
        name: 'Test Key',
        description: 'Test Description',
      })
      expect(mockKeyRepository.create).toHaveBeenCalledWith({
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-ant-test123456',
        name: 'Test Key',
        description: 'Test Description',
      })
    })

    it('should fail when name validation fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: '', // 空名称
        description: 'Test Description',
      }

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('密钥名称')
      expect(mockCrsClient.createKey).not.toHaveBeenCalled()
    })

    it('should fail when key name already exists', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Existing Key',
        description: 'Test Description',
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true, // 名称已存在
      })

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('已存在')
      expect(mockCrsClient.createKey).not.toHaveBeenCalled()
    })

    it('should fail when CRS key creation fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Test Key',
        description: 'Test Description',
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false,
      })

      ;(mockCrsClient.createKey as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('CRS')
      expect(mockKeyRepository.create).not.toHaveBeenCalled()
    })

    it('should fail when local key creation fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Test Key',
        description: 'Test Description',
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false,
      })

      const mockCrsKey = {
        id: 'crs_key_123',
        key: 'sk-ant-test123456',
        name: 'Test Key',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      ;(mockCrsClient.createKey as jest.Mock).mockResolvedValue(mockCrsKey)

      ;(mockKeyRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      })

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Database')
    })

    it('should handle repository errors when checking name existence', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Test Key',
        description: 'Test Description',
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database connection failed'),
      })

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(mockCrsClient.createKey).not.toHaveBeenCalled()
    })

    it('should successfully create key without description and tags', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        name: 'Simple Key',
      }

      ;(mockKeyRepository.existsByName as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false,
      })

      const mockCrsKey = {
        id: 'crs_key_123',
        key: 'sk-ant-simple123',
        name: 'Simple Key',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      ;(mockCrsClient.createKey as jest.Mock).mockResolvedValue(mockCrsKey)

      const mockLocalKey = {
        id: 'key_123',
        userId: 'user_123',
        crsKeyId: 'crs_key_123',
        crsKey: 'sk-ant-simple123',
        name: 'Simple Key',
        description: null,
        status: 'ACTIVE',
        totalCalls: 0,
        totalTokens: 0,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      }

      ;(mockKeyRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockLocalKey,
      })

      // Act
      const result = await createKeyUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe('Simple Key')
    })
  })
})
