/**
 * UpdatePasswordUseCase 单元测试
 * 测试用户密码更新业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { UpdatePasswordUseCase } from '@/lib/application/user/update-password.usecase'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'
import type { PasswordService } from '@/lib/infrastructure/auth/password-service'

describe('UpdatePasswordUseCase', () => {
  let updatePasswordUseCase: UpdatePasswordUseCase
  let mockUserRepository: UserRepository
  let mockPasswordService: PasswordService

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any

    mockPasswordService = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as any

    updatePasswordUseCase = new UpdatePasswordUseCase(
      mockUserRepository,
      mockPasswordService
    )
  })

  describe('execute', () => {
    it('should successfully update password', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true, // Password matches
      } as any)

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 'new_hashed_password',
      } as any)

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: { ...mockUser, passwordHash: 'new_hashed_password' },
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user_123')
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        'OldPass@123',
        'old_hashed_password'
      )
      expect(mockPasswordService.hash).toHaveBeenCalledWith('NewPass@456')
      expect(mockUserRepository.update).toHaveBeenCalledWith('user_123', {
        passwordHash: 'new_hashed_password',
      })
    })

    it('should fail when user does not exist', async () => {
      // Arrange
      const input = {
        userId: 'nonexistent_user',
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('用户不存在')
      expect(mockPasswordService.compare).not.toHaveBeenCalled()
    })

    it('should fail when current password is incorrect', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        currentPassword: 'WrongPassword',
        newPassword: 'NewPass@456',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: false, // Password mismatch
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('当前密码错误')
      expect(mockPasswordService.hash).not.toHaveBeenCalled()
      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when new password is same as current password', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        currentPassword: 'SamePass@123',
        newPassword: 'SamePass@123',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('新密码不能与当前密码相同')
      expect(mockPasswordService.hash).not.toHaveBeenCalled()
    })

    it('should fail when password hashing fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Hash failed'),
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when repository update fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockPasswordService.compare as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: true,
      } as any)

      ;(mockPasswordService.hash as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 'new_hashed_password',
      } as any)

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      } as any)

      // Act
      const result = await updatePasswordUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
    })
  })
})
