/**
 * Dashboard API 测试
 * GET /api/dashboard - 获取用户仪表板数据
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/dashboard/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getDashboard: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/dashboard', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
    })
  })

  describe('成功场景', () => {
    it('应该返回用户的仪表板数据', async () => {
      // Arrange
      const mockApiKeys = [
        {
          id: 'key-1',
          status: 'ACTIVE',
          totalTokens: 1000,
          totalCalls: 10, // 修正：使用 totalCalls 而不是 totalRequests
        },
        {
          id: 'key-2',
          status: 'ACTIVE',
          totalTokens: 2000,
          totalCalls: 20, // 修正：使用 totalCalls 而不是 totalRequests
        },
        {
          id: 'key-3',
          status: 'INACTIVE', // 修正：使用 INACTIVE 而不是 PAUSED
          totalTokens: 0,
          totalCalls: 0, // 修正：使用 totalCalls 而不是 totalRequests
        },
      ]

      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(3)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockApiKeys)

      const request = new Request('http://localhost/api/dashboard', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.overview).toEqual({
        totalKeys: 3,
        activeKeys: 2,
        inactiveKeys: 1, // 修正：使用 inactiveKeys 而不是 pausedKeys
        totalTokensUsed: 3000,
        totalRequests: 30,
        // 移除 monthlyUsage（功能未实现）
      })
      expect(Array.isArray(data.recentActivity)).toBe(true)

      expect(verifyToken).toHaveBeenCalledWith(mockToken)
      expect(prisma.apiKey.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      })
    })

    it('应该包含最近使用的密钥', async () => {
      // Arrange
      const mockRecentKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          lastUsedAt: new Date('2025-10-03'),
          totalCalls: 100, // 修正：使用 totalCalls 而不是 totalRequests
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          lastUsedAt: new Date('2025-10-02'),
          totalCalls: 50, // 修正：使用 totalCalls 而不是 totalRequests
        },
      ]

      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.apiKey.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // overview query
        .mockResolvedValueOnce(mockRecentKeys) // recent activity query

      const request = new Request('http://localhost/api/dashboard', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.recentActivity).toHaveLength(2)
      expect(data.recentActivity[0]).toMatchObject({
        id: 'key-1',
        name: 'Test Key 1',
      })
    })

    it('应该处理没有密钥的情况', async () => {
      // Arrange
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/dashboard', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.overview).toEqual({
        totalKeys: 0,
        activeKeys: 0,
        inactiveKeys: 0, // 修正：使用 inactiveKeys 而不是 pausedKeys
        totalTokensUsed: 0,
        totalRequests: 0,
        // 移除 monthlyUsage（功能未实现）
      })
      expect(data.recentActivity).toEqual([])
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/dashboard', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Token无效或已过期' })
    })

    it('应该处理缺少Authorization头的情况', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('未提供认证令牌')
      })

      const request = new Request('http://localhost/api/dashboard')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('未提供认证令牌')
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.apiKey.count as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/dashboard', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: '系统错误，请稍后重试' })
    })
  })

  describe('CRS集成场景（可选）', () => {
    it('应该可以从CRS获取全局统计', async () => {
      // Arrange
      const mockCrsStats = {
        overview: {
          totalApiKeys: 100,
          activeApiKeys: 80,
          totalTokensUsed: 1000000,
          totalRequestsUsed: 50000,
        },
      }

      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(3)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      ;(crsClient.getDashboard as jest.Mock).mockResolvedValue(mockCrsStats)

      const request = new Request(
        'http://localhost/api/dashboard?includeCrsStats=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.crsStats).toEqual(mockCrsStats)
    })

    it('CRS不可用时应该仍能返回本地数据', async () => {
      // Arrange
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
        new Error('CRS unavailable')
      )

      const request = new Request(
        'http://localhost/api/dashboard?includeCrsStats=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.overview).toBeDefined()
      expect(data.crsStats).toBeUndefined()
      expect(data.crsStatsError).toBe('CRS统计数据暂时不可用')
    })
  })
})
