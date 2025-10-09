/**
 * Leaderboard Stats API 测试
 * GET /api/stats/leaderboard - Top 10排行榜功能
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/leaderboard/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/stats/leaderboard', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({
      userId: mockUserId,
      email: 'test@example.com',
    })
  })

  describe('认证验证', () => {
    it('应该拒绝无认证令牌的请求', async () => {
      const request = new Request('http://localhost/api/stats/leaderboard')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('应该拒绝无效的认证令牌', async () => {
      ;(verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid token')
    })
  })

  describe('排序维度', () => {
    const mockKeys = [
      {
        id: 'key-1',
        name: 'High Token Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(1000000),
        totalCalls: BigInt(1000),
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-10-10'),
      },
      {
        id: 'key-2',
        name: 'High Request Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(500000),
        totalCalls: BigInt(5000),
        createdAt: new Date('2024-01-02'),
        lastUsedAt: new Date('2024-10-09'),
      },
      {
        id: 'key-3',
        name: 'Low Usage Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(100000),
        totalCalls: BigInt(100),
        createdAt: new Date('2024-01-03'),
        lastUsedAt: new Date('2024-10-08'),
      },
    ]

    it('应该默认按总Token数排序', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard).toHaveLength(3)
      expect(data.leaderboard[0].id).toBe('key-1') // 1000000 tokens
      expect(data.leaderboard[0].rank).toBe(1)
      expect(data.leaderboard[1].id).toBe('key-2') // 500000 tokens
      expect(data.leaderboard[1].rank).toBe(2)
      expect(data.leaderboard[2].id).toBe('key-3') // 100000 tokens
      expect(data.leaderboard[2].rank).toBe(3)
    })

    it('应该支持按总请求数排序', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request(
        'http://localhost/api/stats/leaderboard?sortBy=requests',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard[0].id).toBe('key-2') // 5000 requests
      expect(data.leaderboard[1].id).toBe('key-1') // 1000 requests
      expect(data.leaderboard[2].id).toBe('key-3') // 100 requests
    })

    it('应该支持按成本排序（基于token数）', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request(
        'http://localhost/api/stats/leaderboard?sortBy=cost',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard[0].id).toBe('key-1') // highest cost
      expect(data.leaderboard[0].cost).toBeGreaterThan(0)
    })

    it('应该拒绝无效的排序维度', async () => {
      const request = new Request(
        'http://localhost/api/stats/leaderboard?sortBy=invalid',
        {
          headers: { Authorization: mockToken },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('sortBy')
    })
  })

  describe('Top 10限制', () => {
    it('应该只返回Top 10密钥', async () => {
      // 创建15个密钥
      const mockKeys = Array.from({ length: 15 }, (_, i) => ({
        id: `key-${i + 1}`,
        name: `Key ${i + 1}`,
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt((15 - i) * 100000),
        totalCalls: BigInt((15 - i) * 100),
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-10-10'),
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard).toHaveLength(10)
      expect(data.metadata.totalKeys).toBe(15)
      expect(data.metadata.displayedKeys).toBe(10)
    })

    it('应该返回少于10个密钥（如果总数不足）', async () => {
      const mockKeys = Array.from({ length: 5 }, (_, i) => ({
        id: `key-${i + 1}`,
        name: `Key ${i + 1}`,
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt((5 - i) * 100000),
        totalCalls: BigInt((5 - i) * 100),
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-10-10'),
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard).toHaveLength(5)
      expect(data.metadata.totalKeys).toBe(5)
      expect(data.metadata.displayedKeys).toBe(5)
    })
  })

  describe('排名和百分比计算', () => {
    const mockKeys = [
      {
        id: 'key-1',
        name: 'Top Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(1000000),
        totalCalls: BigInt(1000),
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date('2024-10-10'),
      },
      {
        id: 'key-2',
        name: 'Middle Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(500000),
        totalCalls: BigInt(500),
        createdAt: new Date('2024-01-02'),
        lastUsedAt: new Date('2024-10-09'),
      },
      {
        id: 'key-3',
        name: 'Bottom Key',
        status: 'ACTIVE',
        userId: mockUserId,
        totalTokens: BigInt(100000),
        totalCalls: BigInt(100),
        createdAt: new Date('2024-01-03'),
        lastUsedAt: new Date('2024-10-08'),
      },
    ]

    it('应该正确计算排名（从1开始）', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.leaderboard[0].rank).toBe(1)
      expect(data.leaderboard[1].rank).toBe(2)
      expect(data.leaderboard[2].rank).toBe(3)
    })

    it('应该计算相对于最大值的百分比', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.leaderboard[0].percentage).toBe(100) // 1000000/1000000 = 100%
      expect(data.leaderboard[1].percentage).toBe(50) // 500000/1000000 = 50%
      expect(data.leaderboard[2].percentage).toBe(10) // 100000/1000000 = 10%
    })

    it('应该处理零值情况', async () => {
      const zeroMockKeys = [
        {
          id: 'key-1',
          name: 'Zero Key',
          status: 'ACTIVE',
          userId: mockUserId,
          totalTokens: BigInt(0),
          totalCalls: BigInt(0),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: null,
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(zeroMockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard[0].percentage).toBe(0)
    })
  })

  describe('数据字段完整性', () => {
    it('应该包含所有必要的密钥信息', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Test Key',
          status: 'ACTIVE',
          userId: mockUserId,
          totalTokens: BigInt(1000000),
          totalCalls: BigInt(1000),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      const item = data.leaderboard[0]
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('rank')
      expect(item).toHaveProperty('totalTokens')
      expect(item).toHaveProperty('totalRequests')
      expect(item).toHaveProperty('percentage')
      expect(item).toHaveProperty('status')
      expect(item).toHaveProperty('createdAt')
      expect(item).toHaveProperty('lastUsedAt')
    })
  })

  describe('用户权限隔离', () => {
    it('应该只返回当前用户的密钥', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'User 1 Key',
          status: 'ACTIVE',
          userId: mockUserId,
          totalTokens: BigInt(1000000),
          totalCalls: BigInt(1000),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
        },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      await GET(request)

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      )
    })
  })

  describe('错误处理', () => {
    it('应该处理数据库查询错误', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })
  })

  describe('空数据处理', () => {
    it('应该正确处理无密钥的情况', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/stats/leaderboard', {
        headers: { Authorization: mockToken },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leaderboard).toEqual([])
      expect(data.metadata.totalKeys).toBe(0)
      expect(data.metadata.displayedKeys).toBe(0)
    })
  })
})
