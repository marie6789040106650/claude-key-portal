/**
 * RegisterUseCase 单元测试
 * 测试用户注册业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { RegisterUseCase } from '@/lib/application/user/register.usecase'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase
  let mockUserRepository: Partial<UserRepository>
  let mockPasswordService: Partial<PasswordService>

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      existsByEmail: jest.fn(),
      existsByPhone: jest.fn(),
      create: jest.fn(),
    } as any

    // Mock PasswordService
    mockPasswordService = {
      hash: jest.fn(),
    } as any

    // 创建UseCase实例
    registerUseCase = new RegisterUseCase(
      mockUserRepository as UserRepository,
      mockPasswordService as PasswordService
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

      ;(mockUserRepository.existsByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false, // 用户不存在
      })

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      })

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        nickname: 'TestUser',
        createdAt: new Date(),
      }

      ;(mockUserRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      })

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(mockUser)
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('test@example.com')
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

      ;(mockUserRepository.existsByPhone as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false,
      })

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      })

      const mockUser = {
        id: 'user_123',
        phone: '13800138000',
        createdAt: new Date(),
      }

      ;(mockUserRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      })

      // Act
      const result = await registerUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(mockUserRepository.existsByPhone).toHaveBeenCalledWith('13800138000')
    })

    it('should fail when email already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        password: 'Test@1234',
      }

      ;(mockUserRepository.existsByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      })

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

      ;(mockUserRepository.existsByPhone as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      })

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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: null,
      })

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Hash failed'),
      })

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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: null,
      })

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 'hashed_password',
      })

      ;(mockUserRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      })

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
