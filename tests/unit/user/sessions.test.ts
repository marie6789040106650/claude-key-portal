/**
 * Session Management API Tests
 * GET /api/user/sessions - 获取活跃 Session 列表
 * DELETE /api/user/sessions/[id] - 删除指定 Session
 * DELETE /api/user/sessions - 删除所有其他 Session
 *
 * @jest-environment node
 */

import { GET, DELETE } from '@/app/api/user/sessions/route'
import { DELETE as DELETE_BY_ID } from '@/app/api/user/sessions/[id]/route'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/user/sessions', () => {
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
    it('应该返回用户所有活跃 Session', async () => {
      // Arrange
      const mockSessions = [
        {
          id: 'session-1',
          userId: mockUserId,
          token: 'token-1',
          deviceInfo: 'Chrome on macOS',
          ipAddress: '192.168.1.1',
          lastActive: new Date('2025-10-03T10:00:00Z'),
          createdAt: new Date('2025-10-01T10:00:00Z'),
        },
        {
          id: 'session-2',
          userId: mockUserId,
          token: 'token-2',
          deviceInfo: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          lastActive: new Date('2025-10-03T11:00:00Z'),
          createdAt: new Date('2025-10-02T10:00:00Z'),
        },
      ]

      ;(prisma.userSession.findMany as jest.Mock).mockResolvedValue(mockSessions)

      const request = new Request('http://localhost/api/user/sessions', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.sessions).toHaveLength(2)
      expect(data.sessions[0]).toMatchObject({
        id: 'session-1',
        deviceInfo: 'Chrome on macOS',
        ipAddress: '192.168.1.1',
      })
      expect(prisma.userSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { lastActive: 'desc' },
      })
    })

    it('应该隐藏完整 token（只显示前后4位）', async () => {
      // Arrange
      const mockSessions = [
        {
          id: 'session-1',
          userId: mockUserId,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          deviceInfo: 'Chrome',
          lastActive: new Date(),
          createdAt: new Date(),
        },
      ]

      ;(prisma.userSession.findMany as jest.Mock).mockResolvedValue(mockSessions)

      const request = new Request('http://localhost/api/user/sessions', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.sessions[0].token).toMatch(/^eyJh\.{3}XVCJ9$/)
      expect(data.sessions[0].token).not.toBe(mockSessions[0].token)
    })

    it('应该按最后活跃时间降序排列', async () => {
      // Arrange
      const mockSessions = [
        {
          id: 'session-new',
          userId: mockUserId,
          lastActive: new Date('2025-10-03'),
          createdAt: new Date(),
        },
        {
          id: 'session-old',
          userId: mockUserId,
          lastActive: new Date('2025-10-01'),
          createdAt: new Date(),
        },
      ]

      ;(prisma.userSession.findMany as jest.Mock).mockResolvedValue(mockSessions)

      const request = new Request('http://localhost/api/user/sessions', {
        headers: { Authorization: mockToken },
      })

      // Act
      await GET(request)

      // Assert
      expect(prisma.userSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { lastActive: 'desc' },
      })
    })

    it('应该返回空数组（用户没有活跃 Session）', async () => {
      // Arrange
      ;(prisma.userSession.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/user/sessions', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.sessions).toEqual([])
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/user/sessions', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token无效或已过期')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.userSession.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/user/sessions', {
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

describe('DELETE /api/user/sessions/[id]', () => {
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
    it('应该成功删除指定 Session', async () => {
      // Arrange
      const mockSession = {
        id: 'session-to-delete',
        userId: mockUserId,
        token: 'token-123',
      }

      ;(prisma.userSession.findUnique as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.userSession.delete as jest.Mock).mockResolvedValue(mockSession)

      const request = new Request('http://localhost/api/user/sessions/session-to-delete', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE_BY_ID(request, {
        params: { id: 'session-to-delete' },
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe('Session 已删除')
      expect(prisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-to-delete' },
      })
    })
  })

  describe('错误场景', () => {
    it('应该拒绝删除不存在的 Session', async () => {
      // Arrange
      ;(prisma.userSession.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/user/sessions/nonexistent', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE_BY_ID(request, {
        params: { id: 'nonexistent' },
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toBe('Session 不存在')
      expect(prisma.userSession.delete).not.toHaveBeenCalled()
    })

    it('应该拒绝删除其他用户的 Session', async () => {
      // Arrange
      const otherUserSession = {
        id: 'session-other',
        userId: 'other-user-id',
        token: 'token-other',
      }

      ;(prisma.userSession.findUnique as jest.Mock).mockResolvedValue(otherUserSession)

      const request = new Request('http://localhost/api/user/sessions/session-other', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE_BY_ID(request, {
        params: { id: 'session-other' },
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toBe('无权删除此 Session')
      expect(prisma.userSession.delete).not.toHaveBeenCalled()
    })
  })
})

describe('DELETE /api/user/sessions (删除所有其他 Session)', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'
  const mockCurrentSessionId = 'current-session-id'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
      sessionId: mockCurrentSessionId, // 当前 Session ID
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('成功场景', () => {
    it('应该删除所有其他 Session（保留当前）', async () => {
      // Arrange
      ;(prisma.userSession.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })

      const request = new Request('http://localhost/api/user/sessions', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe('已登出所有其他设备')
      expect(data.count).toBe(3)
      expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          id: { not: mockCurrentSessionId },
        },
      })
    })

    it('应该返回删除数量为0（没有其他 Session）', async () => {
      // Arrange
      ;(prisma.userSession.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      const request = new Request('http://localhost/api/user/sessions', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.count).toBe(0)
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/user/sessions', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer invalid-token' },
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Token无效或已过期')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.userSession.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/user/sessions', {
        method: 'DELETE',
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('系统错误，请稍后重试')
    })
  })
})
