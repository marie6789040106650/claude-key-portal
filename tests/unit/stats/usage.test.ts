/**
 * Usage Stats API 测试
 * GET /api/stats/usage - 获取使用统计数据
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/usage/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getDashboard: jest.fn(),
    getKeyStats: jest.fn(),
    getUsageTrend: jest.fn(),
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
          status: 'ACTIVE',
          totalTokens: 1000,
          totalCalls: 10, // 修正：使用 totalCalls 而不是 totalRequests
          createdAt: new Date('2025-10-01'),
          lastUsedAt: new Date('2025-10-03'),
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          status: 'ACTIVE',
          totalTokens: 2000,
          totalCalls: 20, // 修正：使用 totalCalls 而不是 totalRequests
          createdAt: new Date('2025-10-01'),
          lastUsedAt: new Date('2025-10-03'),
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
        crsKey: 'sk-ant-api03-test123', // 修正：使用 crsKey 而不是 keyValue
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10, // 修正：使用 totalCalls 而不是 totalRequests
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
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
        crsKey: 'sk-ant-api03-test123', // 修正：使用 crsKey 而不是 keyValue
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10, // 修正：使用 totalCalls 而不是 totalRequests
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
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
      expect(crsClient.getKeyStats).toHaveBeenCalledWith('sk-ant-api03-test123') // 修正：使用实际的 crsKey
    })

    it('CRS不可用时应该返回本地缓存数据', async () => {
      // Arrange
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        name: 'Test Key',
        crsKey: 'sk-ant-api03-test123', // 修正：使用 crsKey 而不是 keyValue
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10, // 添加必需字段
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
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

  describe('P2.1 - CRS Dashboard API 集成 (🔴 RED)', () => {
    const mockKeys = [
      {
        id: 'key-1',
        name: 'Test Key 1',
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10,
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
      },
    ]

    const mockCrsDashboard = {
      totalKeys: 10,
      activeKeys: 8,
      totalTokens: 50000,
      totalRequests: 500,
    }

    beforeEach(() => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
    })

    it('应该调用 CRS getDashboard API', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockResolvedValue(mockCrsDashboard)

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      await GET(request)

      // Assert
      expect(crsClient.getDashboard).toHaveBeenCalled()
    })

    it('应该在响应中包含 CRS Dashboard 数据', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockResolvedValue(mockCrsDashboard)

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.crsDashboard).toEqual(mockCrsDashboard)
    })

    it('应该合并本地聚合统计和 CRS Dashboard 数据', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockResolvedValue(mockCrsDashboard)

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // 应该包含本地聚合统计
      expect(data.summary).toBeDefined()
      expect(data.summary.totalTokens).toBe(1000)
      expect(data.summary.keyCount).toBe(1)
      // 应该包含 CRS Dashboard 数据
      expect(data.crsDashboard).toEqual(mockCrsDashboard)
      expect(data.crsDashboard.totalKeys).toBe(10)
      expect(data.crsDashboard.totalTokens).toBe(50000)
    })

    it('CRS 不可用时应该降级使用本地数据', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // 应该返回本地统计
      expect(data.summary).toBeDefined()
      expect(data.summary.totalTokens).toBe(1000)
      // 应该有降级警告
      expect(data.crsWarning).toBe('CRS服务暂时不可用，显示本地统计数据')
      // 不应该有 CRS Dashboard 数据
      expect(data.crsDashboard).toBeUndefined()
    })

    it('CRS 超时错误应该降级处理', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      )

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.crsWarning).toBeDefined()
    })

    it('CRS 错误不应该影响整体响应状态', async () => {
      // Arrange
      ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      const response = await GET(request)

      // Assert
      // 不应该返回 500 错误
      expect(response.status).toBe(200)
      expect(response.status).not.toBe(500)
    })

    it('应该记录 CRS 错误日志', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
        new Error('CRS timeout')
      )

      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      await GET(request)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'CRS Dashboard API unavailable, using local stats:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('应该只在获取所有密钥统计时调用 CRS Dashboard', async () => {
      // Arrange: 单个密钥查询
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        name: 'Test Key',
        crsKey: 'sk-ant-api03-test123',
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10,
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
      }
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-1',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      // 单个密钥查询不应该调用 getDashboard
      expect(crsClient.getDashboard).not.toHaveBeenCalled()
    })
  })

  describe('P2.3 - CRS 时间序列趋势图 (🔴 RED)', () => {
    const mockKeys = [
      {
        id: 'key-1',
        name: 'Test Key 1',
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10,
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
      },
    ]

    const mockCrsTrend = [
      {
        date: '2025-10-01',
        totalRequests: 50,
        totalTokens: 5000,
        cost: 0.05,
      },
      {
        date: '2025-10-02',
        totalRequests: 60,
        totalTokens: 6000,
        cost: 0.06,
      },
      {
        date: '2025-10-03',
        totalRequests: 70,
        totalTokens: 7000,
        cost: 0.07,
      },
    ]

    beforeEach(() => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
    })

    it('应该调用 CRS getUsageTrend API', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      expect(crsClient.getUsageTrend).toHaveBeenCalled()
    })

    it('应该支持时间范围参数传递到CRS', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true&startDate=2025-10-01&endDate=2025-10-03',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      expect(crsClient.getUsageTrend).toHaveBeenCalledWith({
        startDate: '2025-10-01',
        endDate: '2025-10-03',
      })
    })

    it('应该返回格式化的趋势数据', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.trend).toBeDefined()
      expect(data.trend).toHaveLength(3)
      expect(data.trend[0]).toMatchObject({
        date: '2025-10-01',
        totalRequests: 50,
        totalTokens: 5000,
        cost: 0.05,
      })
    })

    it('应该在响应中同时包含汇总和趋势数据', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // 应该包含本地汇总
      expect(data.summary).toBeDefined()
      expect(data.summary.totalTokens).toBe(1000)
      // 应该包含趋势数据
      expect(data.trend).toBeDefined()
      expect(data.trend).toHaveLength(3)
    })

    it('CRS趋势API不可用时应该降级处理', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // 应该返回基本统计
      expect(data.summary).toBeDefined()
      // 趋势数据应该为空或不存在
      expect(data.trend).toBeUndefined()
      // 应该有警告信息
      expect(data.trendWarning).toBe('趋势数据暂时不可用')
    })

    it('CRS趋势超时应该降级处理', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      )

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.trendWarning).toBeDefined()
    })

    it('应该验证趋势数据的时间范围', async () => {
      // Arrange
      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true&startDate=invalid-date',
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

    it('应该记录CRS趋势API错误日志', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('CRS timeout')
      )

      const request = new Request(
        'http://localhost/api/stats/usage?includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'CRS Usage Trend API unavailable:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('未指定includeTrend时不应调用CRS趋势API', async () => {
      // Arrange
      const request = new Request('http://localhost/api/stats/usage', {
        headers: { Authorization: mockToken },
      })

      // Act
      await GET(request)

      // Assert
      expect(crsClient.getUsageTrend).not.toHaveBeenCalled()
    })

    it('单个密钥查询时不应调用CRS趋势API', async () => {
      // Arrange
      const mockKey = {
        id: 'key-1',
        userId: mockUserId,
        name: 'Test Key',
        crsKey: 'sk-ant-api03-test123',
        status: 'ACTIVE',
        totalTokens: 1000,
        totalCalls: 10,
        createdAt: new Date('2025-10-01'),
        lastUsedAt: new Date('2025-10-03'),
      }
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      const request = new Request(
        'http://localhost/api/stats/usage?keyId=key-1&includeTrend=true',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      // 趋势图仅用于整体统计，不适用于单个密钥
      expect(crsClient.getUsageTrend).not.toHaveBeenCalled()
    })
  })
})
