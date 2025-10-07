/**
 * RegisterUseCase 单元测试
 * 测试用户注册业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RegisterUseCase } from '@/lib/application/user/register.usecase'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase
  let mockUserRepository: UserRepository
  let mockPasswordService: PasswordService

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      create: vi.fn(),
    } as any

    // Mock PasswordService
    mockPasswordService = {
      hash: vi.fn(),
    } as any

    // 创建UseCase实例
    registerUseCase = new RegisterUseCase(
      mockUserRepository,
      mockPasswordService
    )
  })

  describe('execute', () => {
    it('should successfully register a new user with email', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
        nickname: 'TestUser',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: null, // 用户不存在
      } as any)

      vi.mocked(mockPasswordService.hash).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      } as any)

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        nickname: 'TestUser',
        createdAt: new Date(),
      }

      vi.mocked(mockUserRepository.create).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(mockUser)
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.hash).toHaveBeenCalledWith('Test@1234')
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'TestUser',
      })
    })

    it('should successfully register a new user with phone', async () => {
      // Arrange
      const input = {
        phone: '13800138000',
        password: 'Test@1234',
      }

      vi.mocked(mockUserRepository.findByPhone).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      vi.mocked(mockPasswordService.hash).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      } as any)

      const mockUser = {
        id: 'user_123',
        phone: '13800138000',
        createdAt: new Date(),
      }

      vi.mocked(mockUserRepository.create).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(mockUserRepository.findByPhone).toHaveBeenCalledWith('13800138000')
    })

    it('should fail when email already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        password: 'Test@1234',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: { id: 'existing_user', email: 'existing@example.com' },
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('该邮箱已被注册')
      expect(mockPasswordService.hash).not.toHaveBeenCalled()
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })

    it('should fail when phone already exists', async () => {
      // Arrange
      const input = {
        phone: '13800138000',
        password: 'Test@1234',
      }

      vi.mocked(mockUserRepository.findByPhone).mockResolvedValue({
        isSuccess: true,
        value: { id: 'existing_user', phone: '13800138000' },
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('该手机号已被注册')
    })

    it('should fail when password hashing fails', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      vi.mocked(mockPasswordService.hash).mockResolvedValue({
        isSuccess: false,
        error: new Error('Hash failed'),
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })

    it('should fail when user creation fails', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      vi.mocked(mockPasswordService.hash).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      } as any)

      vi.mocked(mockUserRepository.create).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      } as any)

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
    })

    it('should handle neither email nor phone provided', async () => {
      // Arrange
      const input = {
        password: 'Test@1234',
      } as any

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('邮箱或手机号')
    })
  })
})
