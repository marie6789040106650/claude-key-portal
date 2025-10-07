/**
 * LoginUseCase 单元测试
 * 测试用户登录业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
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
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      updateLastLogin: jest.fn(),
    } as any

    mockSessionRepository = {
      create: jest.fn(),
    } as any

    mockPasswordService = {
      compare: jest.fn(),
    } as any

    mockJwtService = {
      generateTokens: jest.fn(),
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      const mockTokens = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      }

      ;(mockJwtService.generateTokens as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockTokens,
      } as any)

      ;(mockSessionRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: { id: 'session_123' },
      } as any)

      ;(mockUserRepository.updateLastLogin as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByPhone as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      ;(mockJwtService.generateTokens as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: {
          accessToken: 'token',
          refreshToken: 'refresh',
        },
      } as any)

      ;(mockSessionRepository.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: { id: 'session' },
      } as any)

      ;(mockUserRepository.updateLastLogin as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
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

      ;(mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      ;(mockJwtService.generateTokens as jest.Mock).mockResolvedValue({
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
