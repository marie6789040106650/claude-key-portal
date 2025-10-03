/**
 * API密钥创建功能测试
 * Sprint 2 - 🔴 RED Phase
 * @jest-environment node
 */

import { POST } from '@/app/api/keys/route'
import { prisma } from '@/lib/prisma'
import { crsClient } from '@/lib/crs-client'
import jwt from 'jsonwebtoken'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

// Mock CRS Client
jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    createKey: jest.fn(),
  },
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('POST /api/keys', () => {
  const mockUserId = 'user_123'
  const mockAccessToken = 'valid_access_token'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ 成功场景', () => {
    it('应该成功创建API密钥（使用完整参数）', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_123',
        key: 'sk-ant-api03-abc123xyz',
        name: 'Production Key',
        description: 'Production environment key',
        monthlyLimit: 1000000,
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      const mockLocalKey = {
        id: 'local_key_123',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        name: mockCRSKey.name,
        keyPrefix: 'sk-ant-',
        keyMasked: 'sk-ant-***xyz',
        keyValue: mockCRSKey.key,
        description: mockCRSKey.description,
        status: 'ACTIVE',
        tags: ['production', 'important'],
        monthlyLimit: mockCRSKey.monthlyLimit,
        monthlyUsage: 0,
        totalTokens: 0,
        totalRequests: 0,
        createdAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Production Key',
          description: 'Production environment key',
          monthlyLimit: 1000000,
          tags: ['production', 'important'],
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('key')
      expect(data.key).toHaveProperty('id', 'local_key_123')
      expect(data.key).toHaveProperty('name', 'Production Key')
      expect(data.key).toHaveProperty('status', 'ACTIVE')
      expect(data.key).toHaveProperty('keyMasked', 'sk-ant-***xyz')
      expect(data.key).toHaveProperty('tags')
      expect(data.key.tags).toEqual(['production', 'important'])

      // 验证 CRS 调用
      expect(crsClient.createKey).toHaveBeenCalledWith({
        name: 'Production Key',
        description: 'Production environment key',
        monthlyLimit: 1000000,
      })

      // 验证本地数据库创建
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          crsKeyId: mockCRSKey.id,
          name: 'Production Key',
          keyValue: mockCRSKey.key,
          tags: ['production', 'important'],
        }),
        select: expect.any(Object),
      })
    })

    it('应该成功创建API密钥（使用最小参数）', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_456',
        key: 'sk-ant-api03-def456',
        name: 'Simple Key',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      const mockLocalKey = {
        id: 'local_key_456',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        name: mockCRSKey.name,
        keyMasked: 'sk-ant-***456',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Simple Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.key).toHaveProperty('name', 'Simple Key')
      expect(crsClient.createKey).toHaveBeenCalledWith({
        name: 'Simple Key',
      })
    })

    it('应该成功创建带标签的密钥', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_789',
        key: 'sk-ant-api03-ghi789',
        name: 'Tagged Key',
        status: 'ACTIVE',
      }

      const mockLocalKey = {
        id: 'local_key_789',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        name: mockCRSKey.name,
        tags: ['development', 'test', 'staging'],
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Tagged Key',
          tags: ['development', 'test', 'staging'],
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.key.tags).toEqual(['development', 'test', 'staging'])
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: ['development', 'test', 'staging'],
        }),
        select: expect.any(Object),
      })
    })

    it('应该成功创建带月限额的密钥', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_limit',
        key: 'sk-ant-api03-limit123',
        name: 'Limited Key',
        monthlyLimit: 500000,
        status: 'ACTIVE',
      }

      const mockLocalKey = {
        id: 'local_key_limit',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        name: mockCRSKey.name,
        monthlyLimit: 500000,
        monthlyUsage: 0,
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Limited Key',
          monthlyLimit: 500000,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.key).toHaveProperty('monthlyLimit', 500000)
      expect(crsClient.createKey).toHaveBeenCalledWith({
        name: 'Limited Key',
        monthlyLimit: 500000,
      })
    })

    it('创建成功后应该返回完整的密钥值（仅此一次）', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_full',
        key: 'sk-ant-api03-fullkey123456789',
        name: 'Full Key',
        status: 'ACTIVE',
      }

      const mockLocalKey = {
        id: 'local_key_full',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        name: mockCRSKey.name,
        keyValue: mockCRSKey.key,
        keyMasked: 'sk-ant-***789',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Full Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.key).toHaveProperty('keyValue', mockCRSKey.key) // 创建时返回完整密钥
      expect(data).toHaveProperty('warning') // 包含警告信息
      expect(data.warning).toContain('请妥善保管')
    })
  })

  describe('❌ 失败场景 - 认证授权', () => {
    it('应该拒绝缺少Authorization header的请求', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
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
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid_token',
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
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
        method: 'POST',
        headers: {
          Authorization: 'Bearer expired_token',
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token已过期')
    })

    it('应该拒绝非access类型的Token', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'refresh',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token类型错误')
    })
  })

  describe('❌ 失败场景 - 输入验证', () => {
    it('应该拒绝缺少密钥名称的请求', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          description: 'Key without name',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密钥名称')
    })

    it('应该拒绝密钥名称过长', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const longName = 'a'.repeat(101) // 超过100字符

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: longName,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('名称')
      expect(data.error).toContain('100')
    })

    it('应该拒绝无效的月限额', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
          monthlyLimit: -1000, // 负数
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('月限额')
    })

    it('应该拒绝无效的标签格式', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
          tags: 'not-an-array', // 应该是数组
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('标签')
    })

    it('应该拒绝重复的密钥名称', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing_key',
        userId: mockUserId,
        name: 'Existing Key',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Existing Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(data.error).toContain('已存在')
      expect(crsClient.createKey).not.toHaveBeenCalled()
    })
  })

  describe('❌ 失败场景 - CRS集成', () => {
    it('应该处理CRS服务不可用', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.createKey as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(503)
      expect(data.error).toContain('CRS')
      expect(prisma.apiKey.create).not.toHaveBeenCalled()
    })

    it('应该处理CRS返回业务错误', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.createKey as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Rate limit exceeded'), {
          statusCode: 429,
        })
      )

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(data.error).toContain('Rate limit')
    })

    it('应该处理CRS创建成功但本地保存失败', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_orphan',
        key: 'sk-ant-api03-orphan',
        name: 'Orphan Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Orphan Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('本地保存失败')
      expect(data).toHaveProperty('crsKeyId', 'crs_key_orphan') // 返回CRS密钥ID供后续同步
    })
  })

  describe('❌ 失败场景 - 系统错误', () => {
    it('应该处理数据库查询错误', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })

    it('应该处理无效的JSON请求体', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: 'invalid json',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('JSON')
    })
  })

  describe('🔒 安全性检查', () => {
    it('应该只允许用户创建自己的密钥', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_secure',
        key: 'sk-ant-api03-secure',
        name: 'Secure Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'local_key_secure',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
      })

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Secure Key',
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId, // 必须使用token中的userId
        }),
        select: expect.any(Object),
      })
    })

    it('应该验证JWT签名', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer tampered_token',
        },
        body: JSON.stringify({
          name: 'Test Key',
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'tampered_token',
        process.env.JWT_SECRET
      )
    })

    it('应该防止SQL注入攻击', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)

      const maliciousName = "'; DROP TABLE users; --"

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: maliciousName,
        }),
      })

      // Act
      await POST(request)

      // Assert - Prisma自动防止SQL注入，参数化查询
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          name: maliciousName, // 作为字符串处理，不会执行
        },
      })
    })
  })

  describe('📊 数据完整性', () => {
    it('应该正确生成密钥掩码', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_mask',
        key: 'sk-ant-api03-1234567890abcdef',
        name: 'Masked Key',
        status: 'ACTIVE',
      }

      const mockLocalKey = {
        id: 'local_key_mask',
        userId: mockUserId,
        crsKeyId: mockCRSKey.id,
        keyValue: mockCRSKey.key,
        keyPrefix: 'sk-ant-',
        keyMasked: 'sk-ant-***cdef', // 显示前缀和后4位
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockLocalKey)

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Masked Key',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.key).toHaveProperty('keyMasked')
      expect(data.key.keyMasked).toMatch(/^sk-ant-\*\*\*[a-z0-9]{4}$/)
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          keyPrefix: 'sk-ant-',
          keyMasked: expect.stringMatching(/^sk-ant-\*\*\*/),
        }),
        select: expect.any(Object),
      })
    })

    it('应该同步CRS返回的所有字段', async () => {
      // Arrange
      const mockCRSKey = {
        id: 'crs_key_sync',
        key: 'sk-ant-api03-sync123',
        name: 'Sync Key',
        description: 'Full sync test',
        monthlyLimit: 1000000,
        status: 'ACTIVE',
        createdAt: new Date('2025-01-01'),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCRSKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({})

      const request = new Request('http://localhost:3000/api/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          name: 'Sync Key',
          description: 'Full sync test',
          monthlyLimit: 1000000,
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          crsKeyId: mockCRSKey.id,
          keyValue: mockCRSKey.key,
          name: mockCRSKey.name,
          description: mockCRSKey.description,
          monthlyLimit: mockCRSKey.monthlyLimit,
          status: mockCRSKey.status,
        }),
        select: expect.any(Object),
      })
    })
  })
})
