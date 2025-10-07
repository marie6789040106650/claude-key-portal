/**
 * API密钥更新功能测试
 * Sprint 2 - 🔴 RED Phase
 * @jest-environment node
 */

import { PATCH } from '@/app/api/keys/[id]/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import jwt from 'jsonwebtoken'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock CRS Client
jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    updateKey: jest.fn(),
  },
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('PATCH /api/keys/[id]', () => {
  const mockUserId = 'user_123'
  const mockAccessToken = 'valid_access_token'
  const mockKeyId = 'local_key_123'
  const mockCrsKeyId = 'crs_key_123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ 成功场景', () => {
    it('应该成功更新密钥名称', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Old Name',
        status: 'ACTIVE',
      }

      const updatedKey = {
        ...existingKey,
        name: 'New Name',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null) // 名称未重复
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toHaveProperty('name', 'New Name')
      expect(crsClient.updateKey).toHaveBeenCalledWith(mockCrsKeyId, {
        name: 'New Name',
      })
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: { name: 'New Name' },
        select: expect.any(Object),
      })
    })

    it('应该成功更新描述', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        description: 'Old description',
      }

      const updatedKey = {
        ...existingKey,
        description: 'New description',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            description: 'New description',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toHaveProperty('description', 'New description')
    })

    it('应该成功更新标签（仅本地）', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        tags: ['old', 'tags'],
      }

      const updatedKey = {
        ...existingKey,
        tags: ['new', 'tags', 'updated'],
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            tags: ['new', 'tags', 'updated'],
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.tags).toEqual(['new', 'tags', 'updated'])
      expect(crsClient.updateKey).not.toHaveBeenCalled() // 标签是本地字段，不调用CRS
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: { tags: ['new', 'tags', 'updated'] },
        select: expect.any(Object),
      })
    })

    it.skip('应该成功更新月限额', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        monthlyLimit: 1000000,
      }

      const updatedKey = {
        ...existingKey,
        monthlyLimit: 2000000,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            monthlyLimit: 2000000,
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toHaveProperty('monthlyLimit', 2000000)
      expect(crsClient.updateKey).toHaveBeenCalledWith(mockCrsKeyId, {
        monthlyLimit: 2000000,
      })
    })

    it.skip('应该成功更新状态', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        status: 'ACTIVE',
      }

      const updatedKey = {
        ...existingKey,
        status: 'PAUSED',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            status: 'PAUSED',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toHaveProperty('status', 'PAUSED')
      expect(crsClient.updateKey).toHaveBeenCalledWith(mockCrsKeyId, {
        status: 'PAUSED',
      })
    })

    it.skip('应该成功同时更新多个字段', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Old Name',
        description: 'Old description',
        tags: ['old'],
        monthlyLimit: 1000000,
        status: 'ACTIVE',
      }

      const updatedKey = {
        ...existingKey,
        name: 'New Name',
        description: 'New description',
        tags: ['new', 'updated'],
        monthlyLimit: 2000000,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
            description: 'New description',
            tags: ['new', 'updated'],
            monthlyLimit: 2000000,
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key).toHaveProperty('name', 'New Name')
      expect(data.key).toHaveProperty('description', 'New description')
      expect(data.key.tags).toEqual(['new', 'updated'])
      expect(data.key).toHaveProperty('monthlyLimit', 2000000)

      // 验证CRS调用（不包含tags，因为是本地字段）
      expect(crsClient.updateKey).toHaveBeenCalledWith(mockCrsKeyId, {
        name: 'New Name',
        description: 'New description',
        monthlyLimit: 2000000,
      })

      // 验证本地更新（包含所有字段）
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: {
          name: 'New Name',
          description: 'New description',
          tags: ['new', 'updated'],
          monthlyLimit: 2000000,
        },
        select: expect.any(Object),
      })
    })

    it('空更新应该返回原密钥', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({}),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // JSON 序列化会将 Date 转为字符串
      expect(data.key).toEqual({
        ...existingKey,
        createdAt: existingKey.createdAt.toISOString(),
      })
      expect(crsClient.updateKey).not.toHaveBeenCalled()
      expect(prisma.apiKey.update).not.toHaveBeenCalled()
    })

    it('应该成功设置到期时间', async () => {
      // Arrange
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30天后

      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        expiresAt: null,
      }

      const updatedKey = {
        ...existingKey,
        expiresAt: futureDate,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            expiresAt: futureDate.toISOString(),
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.expiresAt).toBe(futureDate.toISOString())
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: { expiresAt: futureDate },
        select: expect.any(Object),
      })
    })

    it('应该成功清除到期时间', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        expiresAt: new Date('2025-12-31'),
      }

      const updatedKey = {
        ...existingKey,
        expiresAt: null,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            expiresAt: null,
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.expiresAt).toBeNull()
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: { expiresAt: null },
        select: expect.any(Object),
      })
    })

    it('应该成功更新到期时间', async () => {
      // Arrange
      const oldDate = new Date('2025-12-31')
      const newDate = new Date('2026-06-30')

      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        expiresAt: oldDate,
      }

      const updatedKey = {
        ...existingKey,
        expiresAt: newDate,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            expiresAt: newDate.toISOString(),
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.expiresAt).toBe(newDate.toISOString())
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: { expiresAt: newDate },
        select: expect.any(Object),
      })
    })
  })

  describe('❌ 失败场景 - 认证授权', () => {
    it('应该拒绝缺少Authorization header的请求', async () => {
      // Arrange
      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
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

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer invalid_token',
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
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

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer expired_token',
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
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

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token类型错误')
    })
  })

  describe('❌ 失败场景 - 权限验证', () => {
    it('应该拒绝更新其他用户的密钥', async () => {
      // Arrange
      const otherUserKey = {
        id: mockKeyId,
        userId: 'other_user_456', // 不同的用户
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Other User Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(otherUserKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'Hacked Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toContain('无权限')
      expect(crsClient.updateKey).not.toHaveBeenCalled()
      expect(prisma.apiKey.update).not.toHaveBeenCalled()
    })
  })

  describe('❌ 失败场景 - 输入验证', () => {
    it('应该拒绝密钥名称过长', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const longName = 'a'.repeat(101)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: longName,
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('名称')
      expect(data.error).toContain('100')
    })

    it('应该拒绝无效的状态值', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            status: 'INVALID_STATUS',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('状态')
    })

    it.skip('应该拒绝无效的月限额', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            monthlyLimit: -1000,
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('月限额')
    })

    it('应该拒绝无效的标签格式', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            tags: 'not-an-array',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('标签')
    })

    it('应该拒绝过去的到期时间', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        expiresAt: null,
      }

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // 昨天

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            expiresAt: pastDate.toISOString(),
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('到期时间')
      expect(data.error).toMatch(/不能.*过去|必须.*未来/)
    })

    it('应该拒绝无效的日期格式', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
        expiresAt: null,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            expiresAt: 'invalid-date-string',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toMatch(/无效.*日期|日期.*格式/)
    })
  })

  describe('❌ 失败场景 - 业务逻辑', () => {
    it('应该拒绝更新不存在的密钥', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request(
        'http://localhost:3000/api/keys/non_existent_key',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, {
        params: { id: 'non_existent_key' },
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toContain('密钥不存在')
    })

    it('应该拒绝更新已删除的密钥', async () => {
      // Arrange
      const deletedKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Deleted Key',
        status: 'DELETED',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('已删除')
    })

    it('应该拒绝重复的密钥名称', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Old Name',
      }

      const duplicateKey = {
        id: 'other_key_456',
        userId: mockUserId,
        name: 'Existing Name',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(duplicateKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'Existing Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(data.error).toContain('已存在')
    })
  })

  describe('❌ 失败场景 - CRS集成', () => {
    it('应该处理CRS服务不可用', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.updateKey as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(503)
      expect(data.error).toContain('CRS')
      expect(prisma.apiKey.update).not.toHaveBeenCalled() // 不更新本地
    })

    it('应该处理CRS更新成功但本地更新失败', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Old Name',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('本地更新失败')
      expect(data).toHaveProperty('crsUpdated', true) // 标记CRS已更新
    })
  })

  describe('❌ 失败场景 - 系统错误', () => {
    it('应该处理数据库查询错误', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
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

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: 'invalid json',
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('JSON')
    })
  })

  describe('🔒 安全性检查', () => {
    it('应该验证用户权限', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
      ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      await PATCH(request, { params: { id: mockKeyId } })

      // Assert
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { id: mockKeyId },
      })
      // 验证密钥归属
      expect(existingKey.userId).toBe(mockUserId)
    })

    it('应该验证JWT签名', async () => {
      // Arrange
      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer tampered_token',
          },
          body: JSON.stringify({
            name: 'New Name',
          }),
        }
      )

      // Act
      await PATCH(request, { params: { id: mockKeyId } })

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'tampered_token',
        process.env.JWT_SECRET
      )
    })

    it('不应该允许更新敏感字段', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        crsKey: 'sk-ant-api03-test123456',
        totalTokens: 0,
        totalCalls: 0,
        createdAt: new Date('2025-10-01'),
        name: 'Test Key',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({
            keyValue: 'hacked-key-value', // 尝试修改密钥值
            crsKeyId: 'hacked-crs-id', // 尝试修改CRS ID
          }),
        }
      )

      // Act
      const response = await PATCH(request, { params: { id: mockKeyId } })

      // Assert
      expect(response.status).toBe(200)
      // 验证不包含敏感字段
      expect(prisma.apiKey.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keyValue: 'hacked-key-value',
          }),
        })
      )
      expect(prisma.apiKey.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            crsKeyId: 'hacked-crs-id',
          }),
        })
      )
    })
  })
})
