/**
 * LoginUseCase 单元测试
 * 测试用户登录业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoginUseCase } from '@/lib/application/user/login.usecase'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { SessionRepository } from '@/lib/infrastructure/persistence/repositories/session.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'
import type { JwtService } from '@/lib/infrastructure/auth/jwt-service'

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let mockUserRepository: UserRepository
  let mockSessionRepository: SessionRepository
  let mockPasswordService: PasswordService
  let mockJwtService: JwtService

  beforeEach(() => {
    // Mock repositories and services
    mockUserRepository = {
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      updateLastLogin: vi.fn(),
    } as any

    mockSessionRepository = {
      create: vi.fn(),
    } as any

    mockPasswordService = {
      compare: vi.fn(),
    } as any

    mockJwtService = {
      generateTokens: vi.fn(),
    } as any

    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockSessionRepository,
      mockPasswordService,
      mockJwtService
    )
  })

  describe('execute', () => {
    it('should successfully login with email', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        nickname: 'TestUser',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      const mockTokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      }

      vi.mocked(mockJwtService.generateTokens).mockResolvedValue({
        isSuccess: true,
        value: mockTokens,
      } as any)

      vi.mocked(mockSessionRepository.create).mockResolvedValue({
        isSuccess: true,
        value: { id: 'session_123' },
      } as any)

      vi.mocked(mockUserRepository.updateLastLogin).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toMatchObject({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          nickname: 'TestUser',
        },
      })
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordService.compare).toHaveBeenCalledWith('Test@1234', 'hashed_password')
      expect(mockJwtService.generateTokens).toHaveBeenCalledWith('user_123', 'test@example.com')
      expect(mockSessionRepository.create).toHaveBeenCalled()
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('user_123')
    })

    it('should successfully login with phone', async () => {
      // Arrange
      const input = {
        phone: '13800138000',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        phone: '13800138000',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      }

      vi.mocked(mockUserRepository.findByPhone).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      vi.mocked(mockJwtService.generateTokens).mockResolvedValue({
        isSuccess: true,
        value: {
          accessToken: 'token',
          refreshToken: 'refresh',
        },
      } as any)

      vi.mocked(mockSessionRepository.create).mockResolvedValue({
        isSuccess: true,
        value: { id: 'session' },
      } as any)

      vi.mocked(mockUserRepository.updateLastLogin).mockResolvedValue({
        isSuccess: true,
        value: undefined,
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(mockUserRepository.findByPhone).toHaveBeenCalledWith('13800138000')
    })

    it('should fail when user does not exist', async () => {
      // Arrange
      const input = {
        email: 'nonexistent@example.com',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('邮箱或密码错误')
      expect(mockPasswordService.compare).not.toHaveBeenCalled()
    })

    it('should fail when password is incorrect', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: false, // Password mismatch
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('邮箱或密码错误')
      expect(mockJwtService.generateTokens).not.toHaveBeenCalled()
    })

    it('should fail when account is suspended', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'SUSPENDED',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('账户已被停用，请联系管理员')
      expect(mockJwtService.generateTokens).not.toHaveBeenCalled()
    })

    it('should fail when account is deleted', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'DELETED',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('账户不存在')
    })

    it('should handle token generation failure', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        password: 'Test@1234',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      }

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      vi.mocked(mockPasswordService.compare).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      vi.mocked(mockJwtService.generateTokens).mockResolvedValue({
        isSuccess: false,
        error: new Error('Token generation failed'),
      } as any)

      // Act
      const result = await loginUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(mockSessionRepository.create).not.toHaveBeenCalled()
    })
  })
})
