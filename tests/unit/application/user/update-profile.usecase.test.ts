/**
 * UpdateProfileUseCase 单元测试
 * 测试用户资料更新业务流程
 *
 * TDD Phase: 🔴 RED
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { UpdateProfileUseCase } from '@/lib/application/user/update-profile.usecase'
import type { UserRepository } from '@/lib/infrastructure/persistence/repositories/user.repository'

describe('UpdateProfileUseCase', () => {
  let updateProfileUseCase: UpdateProfileUseCase
  let mockUserRepository: UserRepository

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any

    updateProfileUseCase = new UpdateProfileUseCase(mockUserRepository)
  })

  describe('execute', () => {
    it('should successfully update user nickname', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        nickname: 'NewNickname',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        nickname: 'OldNickname',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      const updatedUser = {
        ...mockUser,
        nickname: 'NewNickname',
      }

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: updatedUser,
      } as any)

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.nickname).toBe('NewNickname')
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user_123')
      expect(mockUserRepository.update).toHaveBeenCalledWith('user_123', {
        nickname: 'NewNickname',
      })
    })

    it('should successfully update user avatar', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        avatar: 'https://example.com/avatar.jpg',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      const updatedUser = {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      }

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: updatedUser,
      } as any)

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should successfully update multiple fields', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        nickname: 'NewNickname',
        avatar: 'https://example.com/avatar.jpg',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      const updatedUser = {
        ...mockUser,
        nickname: 'NewNickname',
        avatar: 'https://example.com/avatar.jpg',
      }

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: updatedUser,
      } as any)

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value?.nickname).toBe('NewNickname')
      expect(result.value?.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should fail when user does not exist', async () => {
      // Arrange
      const input = {
        userId: 'nonexistent_user',
        nickname: 'NewNickname',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: null,
      } as any)

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('用户不存在')
      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when no fields to update', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
      }

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('至少提供一个')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should fail when repository update fails', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        nickname: 'NewNickname',
      }

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
      }

      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUser,
      } as any)

      ;(mockUserRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: false,
        error: new Error('Database error'),
      } as any)

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
    })

    it('should reject invalid nickname (too long)', async () => {
      // Arrange
      const input = {
        userId: 'user_123',
        nickname: 'A'.repeat(51), // 超过50个字符
      }

      // Act
      const result = await updateProfileUseCase.execute(input)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('昵称')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })
  })
})
