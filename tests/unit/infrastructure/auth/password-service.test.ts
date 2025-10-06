/**
 * PasswordService 测试
 * Phase 2.2 - 🔴 RED Phase
 * @jest-environment node
 */

import { PasswordService } from '@/lib/infrastructure/auth/password-service'
import bcrypt from 'bcryptjs'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('PasswordService', () => {
  let service: PasswordService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PasswordService()
  })

  describe('hash', () => {
    it('应该使用bcrypt加密密码', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz'
      const saltRounds = 10

      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)

      // Act
      const result = await service.hash(plainPassword)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(hashedPassword)
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, saltRounds)
    })

    it('应该使用自定义salt rounds', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const hashedPassword = '$2a$12$abcdefghijklmnopqrstuvwxyz'
      const customSaltRounds = 12

      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)

      // Act
      const result = await service.hash(plainPassword, customSaltRounds)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, customSaltRounds)
    })

    it('当bcrypt抛出错误时应该返回失败', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const error = new Error('Hash failed')

      ;(bcrypt.hash as jest.Mock).mockRejectedValue(error)

      // Act
      const result = await service.hash(plainPassword)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Hash failed')
    })

    it('应该拒绝空密码', async () => {
      // Act
      const result = await service.hash('')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('密码不能为空')
    })
  })

  describe('compare', () => {
    it('应该验证正确的密码', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz'

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Act
      const result = await service.compare(plainPassword, hashedPassword)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword
      )
    })

    it('应该拒绝错误的密码', async () => {
      // Arrange
      const plainPassword = 'WrongPassword'
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz'

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      // Act
      const result = await service.compare(plainPassword, hashedPassword)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(false)
    })

    it('当bcrypt抛出错误时应该返回失败', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz'
      const error = new Error('Compare failed')

      ;(bcrypt.compare as jest.Mock).mockRejectedValue(error)

      // Act
      const result = await service.compare(plainPassword, hashedPassword)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Compare failed')
    })

    it('应该拒绝空密码或空哈希', async () => {
      // Act & Assert
      const result1 = await service.compare('', 'hash')
      expect(result1.isSuccess).toBe(false)

      const result2 = await service.compare('password', '')
      expect(result2.isSuccess).toBe(false)
    })
  })

  describe('verify (别名方法)', () => {
    it('应该是compare方法的别名', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz'

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Act
      const result = await service.verify(plainPassword, hashedPassword)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(true)
    })
  })

  describe('性能优化', () => {
    it('应该在合理时间内完成哈希', async () => {
      // Arrange
      const plainPassword = 'Test@123456'
      ;(bcrypt.hash as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('hash'), 50))
      )

      // Act
      const startTime = Date.now()
      await service.hash(plainPassword)
      const duration = Date.now() - startTime

      // Assert
      expect(duration).toBeLessThan(200) // 应该在200ms内完成
    })
  })
})
