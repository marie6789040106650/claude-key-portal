/**
 * Usage Stats API 测试
 * GET /api/stats/usage - 获取使用统计数据
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/usage/route'
import { prisma } from '@/lib/prisma'
import { crsClient } from '@/lib/crs-client'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    getKeyStats: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/stats/usage', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
    })
  })

  describe('成功场景 - 获取所有密钥统计', () => {
    it('应该返回用户所有密钥的聚合统计', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          keyValue: 'cr_test_key_1',
          status: 'ACTIVE',
          totalTokens: 1000,
          totalRequests: 10,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          keyValue: 'cr_test_key_2',
          status: 'ACTIVE',
          totalTokens: 2000,
          totalRequests: 20,
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        summary: {
          totalTokens: 3000,
          totalRequests: 30,
          averageTokensPerRequest: 100,
          keyCount: 2,
        },
        keys: expect.arrayContaining([
          expect.objectContaining({
            id: 'key-1',
            name: 'Test Key 1',
            totalTokens: 1000,
            totalRequests: 10,
          }),
        ]),
      })
    })

    it('应该处理没有密钥的用户', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.summary).toEqual({
        totalTokens: 0,
        totalRequests: 0,
        averageTokensPerRequest: 0,
        keyCount: 0,
      })
      expect(data.keys).toEqual([])
    })
  })

  describe('成功场景 - 获取单个密钥统计', () => {
    it('应该返回指定密钥的详细统计', async () => {
      // Arrange
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        name: 'Test Key',
        keyValue: 'cr_test_key',
        totalTokens: 1000,
        totalRequests: 10,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-1',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toMatchObject({
        id: 'key-1',
        name: 'Test Key',
        totalTokens: 1000,
        totalRequests: 10,
      })
    })

    it('应该拒绝访问其他用户的密钥', async () => {
      // Arrange
      const otherUserKey = {
        id: 'key-999',
        userId: 'other-user-id',
        name: 'Other Key',
        keyValue: 'cr_other_key',
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(otherUserKey)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-999',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: '无权访问此密钥' })
    })

    it('应该处理密钥不存在的情况', async () => {
      // Arrange
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=nonexistent',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: '密钥不存在' })
    })
  })

  describe('CRS实时统计集成', () => {
    it('应该从CRS获取实时统计数据', async () => {
      // Arrange
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        name: 'Test Key',
        keyValue: 'cr_test_key',
        totalTokens: 1000,
        totalRequests: 10,
      }

      const mockCrsStats = {
        totalTokens: 1500,
        totalRequests: 15,
        monthlyUsage: 1500,
        inputTokens: 800,
        outputTokens: 700,
        cacheCreateTokens: 100,
        cacheReadTokens: 400,
        cost: 0.05,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.getKeyStats as jest.Mock).mockResolvedValue(mockCrsStats)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-1&realtime=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.realtimeStats).toEqual(mockCrsStats)
      expect(crsClient.getKeyStats).toHaveBeenCalledWith('cr_test_key')
    })

    it('CRS不可用时应该返回本地缓存数据', async () => {
      // Arrange
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        keyValue: 'cr_test_key',
        totalTokens: 1000,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(crsClient.getKeyStats as jest.Mock).mockRejectedValue(
        new Error('CRS unavailable')
      )

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-1&realtime=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toBeDefined()
      expect(data.key.realtimeStats).toBeUndefined()
      expect(data.crsWarning).toBe('实时统计暂时不可用，显示缓存数据')
    })
  })

  describe('时间范围过滤', () => {
    it('应该支持按时间范围查询', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          totalTokens: 1000,
          createdAt: new Date('2025-10-01'),
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request(
        'http://localhost/api/stats/usage?startDate=2025-10-01&endDate=2025-10-03',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      )
    })

    it('应该验证时间范围参数', async () => {
      // Arrange
      const request = new Request(
        'http://localhost/api/stats/usage?startDate=invalid-date',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('时间范围参数格式不正确')
    })
  })

  describe('错误场景', () => {
    it('应该拒绝未认证的请求', async () => {
      // Arrange
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token无效或已过期')
      })

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Token无效或已过期' })
    })

    it('应该处理数据库错误', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost/api/stats/usage', {
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
})
