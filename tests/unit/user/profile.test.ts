/**
 * User Profile API Tests
 * GET /api/user/profile - 获取用户信息
 * PUT /api/user/profile - 更新用户信息
 *
 * @jest-environment node
 */

import { GET, PUT } from '@/app/api/user/profile/route'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    apiKey: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/user/profile', () => {
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
    it('应该返回用户完整信息', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-10-03'),
      }

      const mockKeyCount = 5

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(mockKeyCount)

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
        stats: {
          apiKeyCount: mockKeyCount,
        },
      })
    })

    it('应该返回用户信息（无头像和简介）', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Test User',
        avatar: null,
        bio: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-10-03'),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(0)

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.avatar).toBeNull()
      expect(data.bio).toBeNull()
      expect(data.stats.apiKeyCount).toBe(0)
    })

    it('应该包含正确的统计信息', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Test User',
        createdAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(10)

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.stats).toBeDefined()
      expect(data.stats.apiKeyCount).toBe(10)
      expect(prisma.apiKey.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      })
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token无效或已过期')
    })

    it('应该处理用户不存在的情况', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('用户不存在')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/user/profile', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('系统错误，请稍后重试')
    })
  })
})

describe('PUT /api/user/profile', () => {
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
    it('应该成功更新昵称', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'New Nickname',
        avatar: null,
        bio: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: 'New Nickname',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.nickname).toBe('New Nickname')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { nickname: 'New Nickname' },
      })
    })

    it('应该成功更新简介', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Test User',
        bio: 'Updated bio',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: 'Updated bio',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.bio).toBe('Updated bio')
    })

    it('应该同时更新昵称和简介', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'New Name',
        bio: 'New Bio',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: 'New Name',
          bio: 'New Bio',
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.nickname).toBe('New Name')
      expect(data.bio).toBe('New Bio')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          nickname: 'New Name',
          bio: 'New Bio',
        },
      })
    })

    it('应该忽略不允许更新的字段', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        nickname: 'Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: 'Updated',
          email: 'hacker@evil.com', // 不应该被更新
          password: 'hacked', // 不应该被更新
        }),
      })

      // Act
      const response = await PUT(request)

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { nickname: 'Updated' },
      })
      expect(prisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: expect.anything(),
            password: expect.anything(),
          }),
        })
      )
    })
  })

  describe('验证场景', () => {
    it('应该验证昵称长度（最大50字符）', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: 'a'.repeat(51), // 超过50字符
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('昵称')
    })

    it('应该验证简介长度（最大200字符）', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: 'a'.repeat(201), // 超过200字符
        }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('简介')
    })

    it('应该拒绝空对象（没有更新内容）', async () => {
      // Arrange
      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('没有需要更新的内容')
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: { Authorization: 'Bearer invalid-token' },
        body: JSON.stringify({ nickname: 'Test' }),
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token无效或已过期')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: 'Test' }),
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
