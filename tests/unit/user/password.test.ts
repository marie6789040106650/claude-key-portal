/**
 * Password Management API Tests
 * PUT /api/user/password - 修改密码
 *
 * @jest-environment node
 */

import { PUT } from '@/app/api/user/password/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcrypt'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordHistory: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('bcrypt')

describe('PUT /api/user/password', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('成功场景', () => {
    it('应该成功修改密码', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        password: 'hashed_old_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // 旧密码验证通过
        .mockResolvedValueOnce(false) // 新旧密码不同
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed_new_password',
      })
      ;(prisma.passwordHistory.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe('密码修改成功')
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123!', 'hashed_old_password')
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456!', 10)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { password: 'hashed_new_password' },
      })
    })

    it('应该记录密码修改历史', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        password: 'hashed_old_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // 旧密码验证通过
        .mockResolvedValueOnce(false) // 新旧密码不同
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password')
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.passwordHistory.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      await PUT(request)

      // Assert
      expect(prisma.passwordHistory.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          hashedPassword: 'hashed_old_password',
        },
      })
    })
  })

  describe('密码验证', () => {
    it('应该验证旧密码是否正确', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        password: 'hashed_old_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false) // 旧密码不匹配

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('旧密码不正确')
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('应该验证新密码强度（至少8位）', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'Short1!', // 只有7位
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码强度')
      expect(data.error).toContain('至少8位')
    })

    it('应该验证新密码包含大写字母', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'lowercase123!', // 没有大写字母
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码强度')
      expect(data.error).toContain('大写字母')
    })

    it('应该验证新密码包含小写字母', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'UPPERCASE123!', // 没有小写字母
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码强度')
      expect(data.error).toContain('小写字母')
    })

    it('应该验证新密码包含数字', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NoNumber!Pass', // 没有数字
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码强度')
      expect(data.error).toContain('数字')
    })

    it('应该验证新密码包含特殊字符', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NoSpecialChar123', // 没有特殊字符
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码强度')
      expect(data.error).toContain('特殊字符')
    })

    it('应该拒绝与旧密码相同的新密码', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        password: 'hashed_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // 旧密码验证通过
        .mockResolvedValueOnce(true) // 新密码与旧密码相同

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('新密码不能与旧密码相同')
    })
  })

  describe('必需参数验证', () => {
    it('应该验证缺少旧密码', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('缺少必需参数: oldPassword')
    })

    it('应该验证缺少新密码', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('缺少必需参数: newPassword')
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({
          oldPassword: 'Old123!',
          newPassword: 'New456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token无效或已过期')
    })

    it('应该处理用户不存在的情况', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('用户不存在')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        password: 'hashed_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // 旧密码验证通过
        .mockResolvedValueOnce(false) // 新旧密码不同
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new')
      ;(prisma.passwordHistory.create as jest.Mock).mockResolvedValue({})
      ;(prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('系统错误，请稍后重试')
    })
  })
})
