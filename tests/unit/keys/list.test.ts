/**
 * API密钥列表功能测试
 * Sprint 2 - 🔴 RED Phase
 * @jest-environment node
 */

import { GET } from '@/app/api/keys/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import jwt from 'jsonwebtoken'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock CRS Client
jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    listKeys: jest.fn(),
  },
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('GET /api/keys', () => {
  const mockUserId = 'user_123'
  const mockAccessToken = 'valid_access_token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ 成功场景', () => {
    it('应该成功返回用户的API密钥列表', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123xyz',
          userId: mockUserId,
          name: 'Production Key',
          keyPrefix: 'sk-ant-',
          keyMasked: 'sk-ant-***xyz',
          status: 'ACTIVE',
          tags: ['production'],
          monthlyLimit: 1000000,
          monthlyUsage: 50000,
          createdAt: new Date('2025-01-01'),
          lastUsedAt: new Date('2025-01-15'),
        },
        {
          id: 'key_2',
          crsKeyId: 'crs_key_2',
          crsKey: 'sk-ant-api03-test456abc',
          userId: mockUserId,
          name: 'Development Key',
          keyPrefix: 'sk-ant-',
          keyMasked: 'sk-ant-***abc',
          status: 'ACTIVE',
          tags: ['development'],
          monthlyLimit: 100000,
          monthlyUsage: 5000,
          createdAt: new Date('2025-01-02'),
          lastUsedAt: new Date('2025-01-14'),
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(2)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('keys')
      expect(data).toHaveProperty('total', 2)
      expect(data.keys).toHaveLength(2)
      expect(data.keys[0]).toHaveProperty('id', 'key_1')
      expect(data.keys[0]).toHaveProperty('name', 'Production Key')
      expect(data.keys[0]).toHaveProperty('status', 'ACTIVE')
      expect(data.keys[0]).not.toHaveProperty('keyValue') // 不应该包含完整密钥
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('应该支持分页查询', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123xyz',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Key 1',
          keyMasked: 'sk-ant-***xyz',
          status: 'ACTIVE',
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(10)

      const request = new Request(
        'http://localhost:3000/api/keys?page=2&limit=5',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('page', 2)
      expect(data).toHaveProperty('limit', 5)
      expect(data).toHaveProperty('total', 10)
      expect(data).toHaveProperty('totalPages', 2)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
      })
    })

    it('应该支持按状态筛选', async () => {
      // Arrange
      const mockActiveKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Active Key',
          status: 'ACTIVE',
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockActiveKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)

      const request = new Request(
        'http://localhost:3000/api/keys?status=ACTIVE',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: 'ACTIVE',
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('应该支持按标签筛选', async () => {
      // Arrange
      const mockTaggedKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Production Key',
          tags: ['production'],
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockTaggedKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)

      const request = new Request(
        'http://localhost:3000/api/keys?tag=production',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          tags: { has: 'production' },
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('应该返回密钥的使用统计', async () => {
      // Arrange
      const mockKeyWithStats = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123',
          userId: mockUserId,
          name: 'Key with Stats',
          monthlyLimit: 1000000,
          monthlyUsage: 50000,
          totalTokens: 5000000,
          totalCalls: 1000,
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(
        mockKeyWithStats
      )
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys[0]).toHaveProperty('totalTokens', 5000000)
      expect(data.keys[0]).toHaveProperty('totalRequests', 1000)
      expect(data.keys[0]).toHaveProperty('lastUsedAt')
    })

    it('应该返回空列表当用户没有密钥时', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(0)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toEqual([])
      expect(data.total).toBe(0)
    })
  })

  describe('❌ 失败场景 - 认证授权', () => {
    it('应该拒绝缺少Authorization header的请求', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('未登录')
    })

    it('应该拒绝无效的JWT Token', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token无效')
    })

    it('应该拒绝过期的JWT Token', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('Token expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer expired_token',
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token已过期')
    })

    it('应该拒绝非access类型的Token', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'refresh', // 错误的token类型
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token类型错误')
    })
  })

  describe('❌ 失败场景 - 输入验证', () => {
    it('应该拒绝无效的分页参数 - page为负数', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request(
        'http://localhost:3000/api/keys?page=-1&limit=10',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('分页参数')
    })

    it('应该拒绝无效的分页参数 - limit超出范围', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request(
        'http://localhost:3000/api/keys?page=1&limit=101',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('limit')
    })

    it('应该拒绝无效的状态参数', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request(
        'http://localhost:3000/api/keys?status=INVALID_STATUS',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('状态')
    })
  })

  describe('❌ 失败场景 - 系统错误', () => {
    it('应该处理数据库查询错误', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })

    it('应该处理CRS服务不可用', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(0)
      ;(crsClient.listKeys as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request(
        'http://localhost:3000/api/keys?sync=true',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200) // 应该继续返回本地数据
      expect(data).toHaveProperty('syncWarning') // 但警告同步失败
    })
  })

  describe('🔒 安全性检查', () => {
    it('应该只返回当前用户的密钥', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(0)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      await GET(request)

      // Assert
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }, // 必须包含用户ID过滤
        select: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 10,
      })
    })

    it('响应中不应该包含完整的密钥值', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test123xyz',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Test Key',
          keyMasked: 'sk-ant-***xyz',
          status: 'ACTIVE',
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.keys[0]).toHaveProperty('keyMasked') // 只有掩码版本
      expect(data.keys[0]).not.toHaveProperty('keyValue') // 没有完整密钥
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('应该验证JWT签名', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer tampered_token',
        },
      })

      // Act
      await GET(request)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'tampered_token',
        process.env.JWT_SECRET
      )
    })
  })

  describe('🔄 CRS同步', () => {
    it('应该与CRS数据保持同步', async () => {
      // Arrange
      const mockLocalKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Local Key',
          monthlyUsage: 1000,
        },
      ]

      const mockCRSKeys = [
        {
          id: 'crs_key_1',
          name: 'CRS Key',
          usage: 1500, // CRS上的使用量更新了
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockLocalKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)
      ;(crsClient.listKeys as jest.Mock).mockResolvedValue(mockCRSKeys)

      const request = new Request(
        'http://localhost:3000/api/keys?sync=true',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(crsClient.listKeys).toHaveBeenCalledWith(mockUserId)
      expect(data).toHaveProperty('syncedAt') // 包含同步时间
    })

    it('应该标记本地数据与CRS不一致的密钥', async () => {
      // Arrange
      const mockLocalKeys = [
        {
          id: 'key_1',
          crsKeyId: 'crs_key_1',
          crsKey: 'sk-ant-api03-test',
          totalTokens: 0,
          totalCalls: 0,
          createdAt: new Date('2025-10-01'),
          userId: mockUserId,
          name: 'Local Key',
          status: 'ACTIVE',
        },
      ]

      const mockCRSKeys = [
        {
          id: 'crs_key_1',
          name: 'CRS Key',
          status: 'REVOKED', // CRS上被撤销了
        },
      ]

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockLocalKeys)
      ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)
      ;(crsClient.listKeys as jest.Mock).mockResolvedValue(mockCRSKeys)

      const request = new Request(
        'http://localhost:3000/api/keys?sync=true',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('syncIssues') // 标记同步问题
      expect(data.syncIssues).toContainEqual(
        expect.objectContaining({
          keyId: 'key_1',
          issue: 'status_mismatch',
        })
      )
    })
  })
})
