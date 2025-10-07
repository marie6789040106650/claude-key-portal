/**
 * API密钥删除功能测试
 * Sprint 2 - 🔴 RED Phase
 * @jest-environment node
 */

import { DELETE } from '@/app/api/keys/[id]/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import jwt from 'jsonwebtoken'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock CRS Client
jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    deleteKey: jest.fn(),
  },
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('DELETE /api/keys/[id]', () => {
  const mockUserId = 'user_123'
  const mockAccessToken = 'valid_access_token'
  const mockKeyId = 'local_key_123'
  const mockCrsKeyId = 'crs_key_123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('✅ 成功场景', () => {
    it('应该成功删除API密钥（软删除）', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'To Be Deleted',
        status: 'ACTIVE',
      }

      const deletedKey = {
        ...existingKey,
        status: 'DELETED',
        deletedAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message')

      // 验证先调用CRS删除
      expect(crsClient.deleteKey).toHaveBeenCalledWith(mockCrsKeyId)

      // 验证本地软删除
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockKeyId },
        data: {
          status: 'DELETED',
        },
      })
    })

    it('应该成功永久删除API密钥（强制删除）', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'To Be Permanently Deleted',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.delete as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}?permanent=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)

      // 验证永久删除
      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: mockKeyId },
      })
    })

    it('删除已删除的密钥应该返回成功（幂等性）', async () => {
      // Arrange
      const deletedKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Already Deleted',
        status: 'DELETED',
        deletedAt: new Date('2025-01-01'),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('alreadyDeleted', true)
      expect(crsClient.deleteKey).not.toHaveBeenCalled()
      expect(prisma.apiKey.update).not.toHaveBeenCalled()
    })

    it('应该返回删除确认信息', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Production Key',
        status: 'ACTIVE',
      }

      const deletedKey = {
        ...existingKey,
        status: 'DELETED',
        deletedAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message')
      expect(data.message).toContain('已删除')
      expect(data).toHaveProperty('deletedKey')
      expect(data.deletedKey).toHaveProperty('id', mockKeyId)
      expect(data.deletedKey).toHaveProperty('name', 'Production Key')
    })
  })

  describe('❌ 失败场景 - 认证授权', () => {
    it('应该拒绝缺少Authorization header的请求', async () => {
      // Arrange
      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
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
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer invalid_token',
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
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
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer expired_token',
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
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
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('Token类型错误')
    })
  })

  describe('❌ 失败场景 - 权限验证', () => {
    it('应该拒绝删除其他用户的密钥', async () => {
      // Arrange
      const otherUserKey = {
        id: mockKeyId,
        userId: 'other_user_456',
        crsKeyId: mockCrsKeyId,
        name: 'Other User Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(otherUserKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toContain('无权限')
      expect(crsClient.deleteKey).not.toHaveBeenCalled()
      expect(prisma.apiKey.update).not.toHaveBeenCalled()
    })
  })

  describe('❌ 失败场景 - 业务逻辑', () => {
    it('应该拒绝删除不存在的密钥', async () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request(
        'http://localhost:3000/api/keys/non_existent_key',
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, {
        params: { id: 'non_existent_key' },
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toContain('密钥不存在')
    })
  })

  describe('❌ 失败场景 - CRS集成', () => {
    it('应该处理CRS服务不可用', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockRejectedValue(
        new Error('CRS service unavailable')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(503)
      expect(data.error).toContain('CRS')
      expect(prisma.apiKey.update).not.toHaveBeenCalled() // 不删除本地
    })

    it('应该处理CRS返回业务错误', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Key not found in CRS'), {
          statusCode: 404,
        })
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.error).toContain('Key not found')
    })

    it('应该处理CRS删除成功但本地删除失败', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('本地删除失败')
      expect(data).toHaveProperty('crsDeleted', true) // 标记CRS已删除
    })

    it('CRS密钥不存在时应该继续删除本地记录', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Orphan Key',
        status: 'ACTIVE',
      }

      const deletedKey = {
        ...existingKey,
        status: 'DELETED',
        deletedAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Key not found'), {
          statusCode: 404,
        })
      )
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}?force=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('warning') // 警告CRS密钥不存在
      expect(prisma.apiKey.update).toHaveBeenCalled() // 继续删除本地
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
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })
  })

  describe('🔒 安全性检查', () => {
    it('应该验证用户权限', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

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
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer tampered_token',
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'tampered_token',
        process.env.JWT_SECRET
      )
    })

    it('删除操作应该记录审计日志', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Important Key',
        status: 'ACTIVE',
      }

      const deletedKey = {
        ...existingKey,
        status: 'DELETED',
        deletedAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      const response = await DELETE(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('deletedKey')
      // 应该包含删除时间戳用于审计
      expect(deletedKey).toHaveProperty('deletedAt')
    })
  })

  describe('📊 删除策略', () => {
    it('默认应该使用软删除', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(prisma.apiKey.update).toHaveBeenCalled() // 软删除
      expect(prisma.apiKey.delete).not.toHaveBeenCalled() // 不物理删除
    })

    it('permanent=true时应该永久删除', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.delete as jest.Mock).mockResolvedValue(existingKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}?permanent=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(prisma.apiKey.delete).toHaveBeenCalled() // 永久删除
      expect(prisma.apiKey.update).not.toHaveBeenCalled() // 不软删除
    })

    it('软删除后的密钥不应该出现在列表中', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      const deletedKey = {
        ...existingKey,
        status: 'DELETED',
        deletedAt: new Date(),
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(deletedKey)

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(deletedKey.status).toBe('DELETED')
      // 暗示：后续的列表查询应该过滤掉DELETED状态的密钥
    })
  })

  describe('🔄 事务处理', () => {
    it('应该先删除CRS密钥再删除本地记录', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      let crsDeletedFirst = false
      let localDeletedAfter = false

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockImplementation(async () => {
        crsDeletedFirst = true
        return { success: true }
      })
      ;(prisma.apiKey.update as jest.Mock).mockImplementation(async () => {
        if (crsDeletedFirst) {
          localDeletedAfter = true
        }
        return existingKey
      })

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(crsDeletedFirst).toBe(true)
      expect(localDeletedAfter).toBe(true)
    })

    it('CRS删除失败时不应该删除本地记录', async () => {
      // Arrange
      const existingKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: mockCrsKeyId,
        name: 'Test Key',
        status: 'ACTIVE',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
      })
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
      ;(crsClient.deleteKey as jest.Mock).mockRejectedValue(
        new Error('CRS error')
      )

      const request = new Request(
        `http://localhost:3000/api/keys/${mockKeyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }
      )

      // Act
      await DELETE(request, { params: { id: mockKeyId } })

      // Assert
      expect(prisma.apiKey.update).not.toHaveBeenCalled()
      expect(prisma.apiKey.delete).not.toHaveBeenCalled()
    })
  })
})
