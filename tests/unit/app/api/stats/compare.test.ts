/**
 * Compare Stats API 测试
 * GET /api/stats/compare - 多密钥对比功能
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/compare/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getKeyStats: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/stats/compare', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
    })
  })

  describe('参数验证', () => {
    it('应该拒绝缺少 keyIds 参数的请求', async () => {
      const request = new Request('http://localhost/api/stats/compare', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('keyIds')
    })

    it('应该拒绝少于 2 个密钥的请求', async () => {
      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('至少需要2个密钥')
    })

    it('应该拒绝超过 5 个密钥的请求', async () => {
      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2,key-3,key-4,key-5,key-6',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('最多支持5个密钥')
    })
  })

  describe('成功场景 - 2个密钥对比', () => {
    it('应该返回2个密钥的对比统计', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      const mockStats1 = {
        totalTokens: 1000,
        totalRequests: 10,
        inputTokens: 600,
        outputTokens: 400,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0.5,
      }

      const mockStats2 = {
        totalTokens: 2000,
        totalRequests: 20,
        inputTokens: 1200,
        outputTokens: 800,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 1.0,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(crsClient.getKeyStats as jest.Mock)
        .mockResolvedValueOnce(mockStats1)
        .mockResolvedValueOnce(mockStats2)

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(2)
      expect(data.keys[0]).toMatchObject({
        id: 'key-1',
        name: 'Test Key 1',
        stats: {
          totalTokens: 1000,
          totalRequests: 10,
          cost: 0.5,
        },
      })
      expect(data.keys[1]).toMatchObject({
        id: 'key-2',
        name: 'Test Key 2',
        stats: {
          totalTokens: 2000,
          totalRequests: 20,
          cost: 1.0,
        },
      })
    })

    it('应该计算对比数据和排名', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      const mockStats1 = {
        totalTokens: 1000,
        totalRequests: 10,
        inputTokens: 600,
        outputTokens: 400,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0.5,
      }

      const mockStats2 = {
        totalTokens: 2000,
        totalRequests: 20,
        inputTokens: 1200,
        outputTokens: 800,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 1.0,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(crsClient.getKeyStats as jest.Mock)
        .mockResolvedValueOnce(mockStats1)
        .mockResolvedValueOnce(mockStats2)

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.comparison).toEqual({
        maxTokens: { keyId: 'key-2', keyName: 'Test Key 2', value: 2000 },
        maxRequests: { keyId: 'key-2', keyName: 'Test Key 2', value: 20 },
        maxCost: { keyId: 'key-2', keyName: 'Test Key 2', value: 1.0 },
        totalTokens: 3000,
        totalRequests: 30,
        totalCost: 1.5,
      })
    })
  })

  describe('权限验证', () => {
    it('应该只返回用户自己的密钥', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(crsClient.getKeyStats as jest.Mock).mockResolvedValue({
        totalTokens: 1000,
        totalRequests: 10,
        inputTokens: 600,
        outputTokens: 400,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0.5,
      })

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      await GET(request)

      // Assert
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['key-1', 'key-2'] },
          userId: mockUserId, // 确保查询包含用户ID过滤
        },
        select: {
          id: true,
          name: true,
          crsKey: true,
          status: true,
        },
      })
    })

    it('应该在找不到密钥时返回 404', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('找不到指定的密钥')
    })
  })

  describe('CRS 错误处理', () => {
    it('应该在 CRS 不可用时降级处理', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(crsClient.getKeyStats as jest.Mock).mockRejectedValue(
        new Error('CRS unavailable')
      )

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.warning).toBe('CRS服务暂时不可用，部分数据可能不准确')
      expect(data.keys).toHaveLength(2)
      expect(data.keys[0].stats).toEqual({
        totalTokens: 0,
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      })
    })

    it('应该在部分密钥 CRS 调用失败时继续处理', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      const mockStats1 = {
        totalTokens: 1000,
        totalRequests: 10,
        inputTokens: 600,
        outputTokens: 400,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0.5,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(crsClient.getKeyStats as jest.Mock)
        .mockResolvedValueOnce(mockStats1) // key-1 成功
        .mockRejectedValueOnce(new Error('CRS error')) // key-2 失败

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.warning).toBe('CRS服务暂时不可用，部分数据可能不准确')
      expect(data.keys[0].stats.totalTokens).toBe(1000) // key-1 有数据
      expect(data.keys[1].stats.totalTokens).toBe(0) // key-2 降级
    })
  })

  describe('并行调用优化', () => {
    it('应该并行调用 CRS API 而不是串行', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key 1',
          crsKey: 'cr_test_key_1',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key 2',
          crsKey: 'cr_test_key_2',
          status: 'ACTIVE',
          userId: mockUserId,
        },
        {
          id: 'key-3',
          name: 'Test Key 3',
          crsKey: 'cr_test_key_3',
          status: 'ACTIVE',
          userId: mockUserId,
        },
      ]

      const mockStats = {
        totalTokens: 1000,
        totalRequests: 10,
        inputTokens: 600,
        outputTokens: 400,
        cacheCreateTokens: 0,
        cacheReadTokens: 0,
        cost: 0.5,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // 记录调用时间
      const callTimes: number[] = []
      ;(crsClient.getKeyStats as jest.Mock).mockImplementation(async () => {
        callTimes.push(Date.now())
        await new Promise((resolve) => setTimeout(resolve, 100))
        return mockStats
      })

      const request = new Request(
        'http://localhost/api/stats/compare?keyIds=key-1,key-2,key-3',
        {
          headers: { Authorization: mockToken },
        }
      )

      // Act
      const startTime = Date.now()
      await GET(request)
      const endTime = Date.now()

      // Assert
      // 如果是并行调用，总时间应该接近单次调用时间（~100ms）
      // 如果是串行调用，总时间应该是 3 * 100ms = 300ms
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(200) // 并行调用应该在 200ms 内完成

      // 所有调用应该在相近的时间开始
      const firstCall = callTimes[0]
      const lastCall = callTimes[callTimes.length - 1]
      expect(lastCall - firstCall).toBeLessThan(50) // 所有调用应该在 50ms 内启动
    })
  })
})
