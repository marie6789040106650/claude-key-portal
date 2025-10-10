/**
 * Usage Stats API Tests
 * 测试 GET /api/stats/usage 的高级搜索筛选功能
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/stats/usage/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'

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

// Import after mocks
import { crsClient } from '@/lib/infrastructure/external/crs-client'

describe('GET /api/stats/usage - Advanced Search Filters', () => {
  const mockUserId = 'user-123'
  const mockToken = 'Bearer valid-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })

    // Mock CRS client 方法（默认抛出错误，表示不可用）
    ;(crsClient.getDashboard as jest.Mock).mockRejectedValue(
      new Error('CRS unavailable')
    )
    ;(crsClient.getUsageTrend as jest.Mock).mockRejectedValue(
      new Error('CRS unavailable')
    )
    ;(crsClient.getKeyStats as jest.Mock).mockRejectedValue(
      new Error('CRS unavailable')
    )
  })

  describe('🔴 RED: Name Search Filter', () => {
    it('should filter keys by name (exact match)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Production Key',
          status: 'active',
          totalTokens: 1000n,
          totalCalls: 10n,
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?name=Production Key',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].name).toBe('Production Key')
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            name: {
              contains: 'Production Key',
              mode: 'insensitive',
            },
          }),
        })
      )
    })

    it('should filter keys by name (partial match)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Production API Key',
          status: 'active',
          totalTokens: BigInt(1000),
          totalCalls: BigInt(10),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
        {
          id: 'key-2',
          name: 'Production Test Key',
          status: 'active',
          totalTokens: BigInt(500),
          totalCalls: BigInt(5),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?name=Production',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(2)
      expect(data.keys.every((k: any) => k.name.includes('Production'))).toBe(
        true
      )
    })
  })

  describe('🔴 RED: Status Filter', () => {
    it('should filter keys by status (active)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Active Key',
          status: 'active',
          totalTokens: BigInt(1000),
          totalCalls: BigInt(10),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?status=active',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].status).toBe('active')
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            status: 'active',
          }),
        })
      )
    })

    it('should filter keys by status (inactive)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-2',
          name: 'Inactive Key',
          status: 'inactive',
          totalTokens: BigInt(0),
          totalCalls: BigInt(0),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: null,
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?status=inactive',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].status).toBe('inactive')
    })

    it('should return error for invalid status', async () => {
      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?status=invalid',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('状态参数无效')
    })
  })

  describe('🔴 RED: Usage Range Filter (Tokens)', () => {
    it('should filter keys by minimum tokens', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'High Usage Key',
          status: 'active',
          totalTokens: BigInt(10000),
          totalCalls: BigInt(100),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?minTokens=5000',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].totalTokens).toBeGreaterThanOrEqual(5000)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            totalTokens: { gte: BigInt(5000) },
          }),
        })
      )
    })

    it('should filter keys by maximum tokens', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Low Usage Key',
          status: 'active',
          totalTokens: BigInt(500),
          totalCalls: BigInt(5),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?maxTokens=1000',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].totalTokens).toBeLessThanOrEqual(1000)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            totalTokens: { lte: BigInt(1000) },
          }),
        })
      )
    })

    it('should filter keys by token range (min and max)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Medium Usage Key',
          status: 'active',
          totalTokens: BigInt(5000),
          totalCalls: BigInt(50),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?minTokens=1000&maxTokens=10000',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].totalTokens).toBeGreaterThanOrEqual(1000)
      expect(data.keys[0].totalTokens).toBeLessThanOrEqual(10000)
    })

    it('should return error for invalid token range (negative)', async () => {
      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?minTokens=-100',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('使用量参数必须为非负整数')
    })

    it('should return error for invalid token range (min > max)', async () => {
      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?minTokens=10000&maxTokens=1000',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('最小值不能大于最大值')
    })
  })

  describe('🔴 RED: Usage Range Filter (Requests)', () => {
    it('should filter keys by minimum requests', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'High Request Key',
          status: 'active',
          totalTokens: BigInt(10000),
          totalCalls: BigInt(1000),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?minRequests=500',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].totalRequests).toBeGreaterThanOrEqual(500)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            totalCalls: { gte: BigInt(500) },
          }),
        })
      )
    })

    it('should filter keys by maximum requests', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Low Request Key',
          status: 'active',
          totalTokens: BigInt(500),
          totalCalls: BigInt(50),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?maxRequests=100',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(data.keys[0].totalRequests).toBeLessThanOrEqual(100)
    })
  })

  describe('🔴 RED: Last Used Time Filter', () => {
    it('should filter keys by last used after date', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Recently Used Key',
          status: 'active',
          totalTokens: BigInt(1000),
          totalCalls: BigInt(10),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-10'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?lastUsedAfter=2024-01-05',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            lastUsedAt: { gte: new Date('2024-01-05') },
          }),
        })
      )
    })

    it('should filter keys by last used before date', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Old Key',
          status: 'inactive',
          totalTokens: BigInt(0),
          totalCalls: BigInt(0),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?lastUsedBefore=2024-01-05',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            lastUsedAt: { lte: new Date('2024-01-05') },
          }),
        })
      )
    })

    it('should return error for invalid lastUsedAfter date', async () => {
      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?lastUsedAfter=invalid-date',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('最后使用时间参数格式不正确')
    })
  })

  describe('🔴 RED: Multiple Filters Combination', () => {
    it('should combine name and status filters', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Production Active Key',
          status: 'active',
          totalTokens: BigInt(1000),
          totalCalls: BigInt(10),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?name=Production&status=active',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            name: { contains: 'Production', mode: 'insensitive' },
            status: 'active',
          }),
        })
      )
    })

    it('should combine all filters (name, status, usage range, time range)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Production Key',
          status: 'active',
          totalTokens: BigInt(5000),
          totalCalls: BigInt(50),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-10'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?name=Production&status=active&minTokens=1000&maxTokens=10000&minRequests=10&maxRequests=100&startDate=2024-01-01&endDate=2024-12-31&lastUsedAfter=2024-01-05',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            name: { contains: 'Production', mode: 'insensitive' },
            status: 'active',
            totalTokens: {
              gte: BigInt(1000),
              lte: BigInt(10000),
            },
            totalCalls: {
              gte: BigInt(10),
              lte: BigInt(100),
            },
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
            lastUsedAt: { gte: new Date('2024-01-05') },
          }),
        })
      )
    })

    it('should return empty array when no keys match filters', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const request = new Request(
        'http://localhost:3000/api/stats/usage?name=NonExistent&status=active',
        {
          headers: { Authorization: mockToken },
        }
      )
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(0)
      expect(data.summary.keyCount).toBe(0)
    })
  })
})
