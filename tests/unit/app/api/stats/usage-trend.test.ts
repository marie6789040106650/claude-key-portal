/**
 * Usage Stats API - Trend Data Integration Tests
 * 测试 GET /api/stats/usage 返回CRS趋势数据
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/usage/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'
import { cacheManager } from '@/lib/infrastructure/cache/cache-manager'

// Mock dependencies
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getDashboard: jest.fn(),
    getUsageTrend: jest.fn(),
    getKeyStats: jest.fn(),
  },
}))

jest.mock('@/lib/infrastructure/cache/cache-manager', () => {
  // Mock cache manager inside the factory function
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn(),
    getTTL: jest.fn(),
  }

  return {
    getCacheManager: jest.fn(() => mockCacheManager),
    // Export for test access
    __mockCacheManager: mockCacheManager,
  }
})

// Import after mocks
import { crsClient } from '@/lib/infrastructure/external/crs-client'

// Get mock cache manager
const { __mockCacheManager: mockCacheManager } = jest.requireMock(
  '@/lib/infrastructure/cache/cache-manager'
)

describe('GET /api/stats/usage - Trend Data Integration', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  const mockKeys = [
    {
      id: 'key-1',
      name: 'Test Key',
      status: 'active',
      totalTokens: 1000n,
      totalCalls: 10n,
      createdAt: new Date('2024-01-01'),
      lastUsedAt: new Date('2024-01-02'),
      userId: mockUserId,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })
    ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

    // Mock cache: 默认未命中
    mockCacheManager.get.mockResolvedValue(null)
    mockCacheManager.set.mockResolvedValue(undefined)
    mockCacheManager.generateKey.mockImplementation((...args) => args.join(':'))
    mockCacheManager.getTTL.mockReturnValue(300)

    // Mock CRS client: 默认Dashboard和KeyStats不可用
    ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
      new Error('CRS unavailable')
    )
    ;(crsClient.getKeyStats as jest.Mock).mockRejectedValue(
      new Error('CRS unavailable')
    )
  })

  describe('趋势数据获取', () => {
    it('应该返回时间序列趋势数据', async () => {
      // Arrange: 模拟CRS返回趋势数据
      const mockCrsTrend = [
        { date: '2024-01-01', tokens: 1000, calls: 10 },
        { date: '2024-01-02', tokens: 1500, calls: 15 },
        { date: '2024-01-03', tokens: 2000, calls: 20 },
      ]
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert: 验证返回格式
      expect(response.status).toBe(200)
      expect(data.trend).toBeDefined()
      expect(data.trend).toHaveLength(3)
      expect(data.trend[0]).toEqual({
        timestamp: '2024-01-01T00:00:00.000Z',
        tokens: 1000,
        requests: 10,
      })
      expect(data.trend[1]).toEqual({
        timestamp: '2024-01-02T00:00:00.000Z',
        tokens: 1500,
        requests: 15,
      })
      expect(data.trend[2]).toEqual({
        timestamp: '2024-01-03T00:00:00.000Z',
        tokens: 2000,
        requests: 20,
      })
    })

    it('应该调用CRS getUsageTrend方法', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue([])

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      await GET(request)

      // Assert: 验证调用了CRS API
      expect(crsClient.getUsageTrend).toHaveBeenCalledTimes(1)
      expect(crsClient.getUsageTrend).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        })
      )
    })

    it('应该处理时区转换正确', async () => {
      // Arrange: 测试不同时区的日期
      const mockCrsTrend = [{ date: '2024-06-15', tokens: 1000, calls: 10 }]
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert: 验证时区转换
      expect(data.trend[0].timestamp).toBe('2024-06-15T00:00:00.000Z')
    })
  })

  describe('日期范围参数', () => {
    it('应该支持自定义日期范围', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue([])

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?dateRange=custom&startDate=2024-01-01&endDate=2024-01-31',
        { headers: { Authorization: mockToken } }
      )
      await GET(request)

      // Assert: 验证传递正确的日期范围
      expect(crsClient.getUsageTrend).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
      )
    })

    it('应该支持预设日期范围（last7days）', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue([])
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?dateRange=last7days',
        { headers: { Authorization: mockToken } }
      )
      await GET(request)

      // Assert: 验证计算了正确的日期范围
      expect(crsClient.getUsageTrend).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        })
      )
    })

    it('应该使用默认日期范围（last7days）当未指定时', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue([])

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      await GET(request)

      // Assert
      expect(crsClient.getUsageTrend).toHaveBeenCalledTimes(1)
      const callArgs = (crsClient.getUsageTrend as jest.Mock).mock.calls[0][0]
      expect(callArgs).toHaveProperty('startDate')
      expect(callArgs).toHaveProperty('endDate')
    })
  })

  describe('趋势数据缓存', () => {
    it('应该缓存趋势数据5分钟', async () => {
      // Arrange
      const mockCrsTrend = [{ date: '2024-01-01', tokens: 1000, calls: 10 }]
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue(mockCrsTrend)

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      await GET(request)

      // Assert: 验证缓存设置
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('trend'),
        mockCrsTrend,
        300 // 5分钟 = 300秒
      )
    })

    it('缓存命中时不应调用CRS API', async () => {
      // Arrange: 模拟缓存命中
      const cachedTrend = [{ date: '2024-01-01', tokens: 1000, calls: 10 }]
      mockCacheManager.get.mockImplementation((key) => {
        if (key.includes('trend')) {
          return Promise.resolve(cachedTrend)
        }
        return Promise.resolve(null)
      })

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert: 应该使用缓存数据
      expect(crsClient.getUsageTrend).not.toHaveBeenCalled()
      expect(data.trend).toBeDefined()
      expect(data.trend).toHaveLength(1)
    })

    it('应该使用正确的缓存键命名规范', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockResolvedValue([])

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?dateRange=custom&startDate=2024-01-01&endDate=2024-01-31',
        { headers: { Authorization: mockToken } }
      )
      await GET(request)

      // Assert: 验证缓存键包含日期范围
      expect(mockCacheManager.generateKey).toHaveBeenCalledWith(
        'crs',
        'trend',
        expect.stringContaining('2024-01-01')
      )
      expect(mockCacheManager.generateKey).toHaveBeenCalledWith(
        'crs',
        'trend',
        expect.stringContaining('2024-01-31')
      )
    })
  })

  describe('错误处理', () => {
    it('CRS不可用时应返回空趋势数组', async () => {
      // Arrange: 模拟CRS不可用
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('CRS unavailable')
      )

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert: 应该返回空数组和警告
      expect(response.status).toBe(200)
      expect(data.trend).toEqual([])
      expect(data.crsWarning).toContain('趋势数据暂时不可用')
    })

    it('CRS错误不应影响其他数据返回', async () => {
      // Arrange
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert: 其他字段应该正常返回
      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.keys).toBeDefined()
      expect(data.trend).toEqual([])
    })

    it('应该记录CRS趋势获取失败的日志', async () => {
      // Arrange
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
        new Error('Timeout')
      )

      // Act
      const request = new Request('http://localhost:3000/api/stats/usage', {
        headers: { Authorization: mockToken },
      })
      await GET(request)

      // Assert: 验证警告日志
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch trend data'),
        expect.any(Error)
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
