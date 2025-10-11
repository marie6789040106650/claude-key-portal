/**
 * API Keys Field Alias Tests
 * 测试API响应中totalRequests字段别名的正确性
 *
 * 背景: 修复P0问题 - API返回totalCalls，前端期望totalRequests
 * 解决方案: 在API响应中同时提供totalCalls和totalRequests两个字段
 *
 * TDD Phase: 🟢 GREEN
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/keys/route'
import { GET as GET_DETAIL } from '@/app/api/keys/[id]/route'
import { PUT, PATCH } from '@/app/api/keys/[id]/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}))

jest.mock('@/lib/infrastructure/persistence/repositories', () => ({
  keyRepository: {
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: {
    getApiKeys: jest.fn(),
    updateKey: jest.fn(),
  },
}))

jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { getAuthenticatedUser } from '@/lib/auth'
import { keyRepository } from '@/lib/infrastructure/persistence/repositories'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

describe('API Keys - totalRequests Field Alias', () => {
  const mockUserId = 'user-123'
  const mockKeyId = 'key-123'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock auth
    ;(getAuthenticatedUser as jest.Mock).mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
    })
  })

  describe('GET /api/keys - 列表API字段别名', () => {
    it('应该在响应中同时包含 totalCalls 和 totalRequests 字段', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          crsKeyId: 'crs-key-1',
          userId: mockUserId,
          name: 'Test Key',
          status: 'ACTIVE',
          totalCalls: 1542,
          totalTokens: 154200,
          lastUsedAt: null,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ]

      ;(keyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })
      ;(keyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 1,
      })

      // Act
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
        headers: { Cookie: 'accessToken=xxx' },
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(1)

      const key = data.keys[0]
      expect(key.totalCalls).toBe(1542)
      expect(key.totalRequests).toBe(1542) // ← 别名字段
      expect(key.totalCalls).toBe(key.totalRequests) // ← 值应相同
    })

    it('totalRequests 应该等于 totalCalls (数值一致性)', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: mockUserId,
          totalCalls: 9999,
          totalTokens: 999900,
          crsKeyId: 'crs-1',
          name: 'Key 1',
          status: 'ACTIVE',
          lastUsedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'key-2',
          userId: mockUserId,
          totalCalls: 0,
          totalTokens: 0,
          crsKeyId: 'crs-2',
          name: 'Key 2',
          status: 'INACTIVE',
          lastUsedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(keyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })
      ;(keyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 2,
      })

      // Act
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.keys).toHaveLength(2)
      data.keys.forEach((key: any) => {
        expect(key.totalRequests).toBe(key.totalCalls)
      })
    })
  })

  describe('GET /api/keys/[id] - 详情API字段别名', () => {
    it('应该在响应中同时包含 totalCalls 和 totalRequests 字段', async () => {
      // Arrange
      const mockKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: 'crs-key-1',
        crsKey: 'cr_abc123def456ghi789',
        name: 'Test Key',
        status: 'ACTIVE',
        totalCalls: BigInt(2500),
        totalTokens: BigInt(250000),
        description: 'Test description',
        lastUsedAt: new Date('2025-01-01'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      // Act
      const request = new Request(`http://localhost:3000/api/keys/${mockKeyId}`, {
        method: 'GET',
      })
      const response = await GET_DETAIL(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.totalCalls).toBe(2500)
      expect(data.totalRequests).toBe(2500) // ← 别名字段
      expect(data.totalCalls).toBe(data.totalRequests)
    })

    it('BigInt 转 Number 后 totalRequests 应该正确', async () => {
      // Arrange
      const mockKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: 'crs-key-1',
        crsKey: 'cr_test',
        name: 'Test',
        status: 'ACTIVE',
        totalCalls: BigInt(999999),
        totalTokens: BigInt(99999900),
        description: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      // Act
      const request = new Request(`http://localhost:3000/api/keys/${mockKeyId}`, {
        method: 'GET',
      })
      const response = await GET_DETAIL(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(data.totalCalls).toBe(999999)
      expect(data.totalRequests).toBe(999999)
      expect(typeof data.totalCalls).toBe('number')
      expect(typeof data.totalRequests).toBe('number')
    })
  })

  describe('PUT /api/keys/[id] - 更新API字段别名', () => {
    it('应该在更新响应中包含 totalRequests 字段', async () => {
      // Arrange
      const mockUpdatedKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: 'crs-key-1',
        name: 'Updated Key',
        status: 'ACTIVE',
        totalCalls: 3000,
        totalTokens: 300000,
        description: 'Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      }

      ;(keyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: { ...mockUpdatedKey, userId: mockUserId },
      })
      ;(keyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUpdatedKey,
      })

      // Act
      const request = new Request(`http://localhost:3000/api/keys/${mockKeyId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Key' }),
      })
      const response = await PUT(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.totalCalls).toBe(3000)
      expect(data.key.totalRequests).toBe(3000) // ← 别名字段
    })
  })

  describe('PATCH /api/keys/[id] - 部分更新API字段别名', () => {
    it('应该在PATCH响应中包含 totalRequests 字段', async () => {
      // Arrange
      const mockUpdatedKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: 'crs-key-1',
        name: 'Patched Key',
        status: 'ACTIVE',
        totalCalls: 4500,
        totalTokens: 450000,
        description: 'Patched',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      }

      ;(keyRepository.findById as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: { ...mockUpdatedKey, userId: mockUserId },
      })
      ;(keyRepository.update as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockUpdatedKey,
      })

      // Act
      const request = new Request(`http://localhost:3000/api/keys/${mockKeyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Patched Key' }),
      })
      const response = await PATCH(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.key.totalCalls).toBe(4500)
      expect(data.key.totalRequests).toBe(4500) // ← 别名字段
    })
  })

  describe('向后兼容性测试', () => {
    it('前端代码应该可以同时使用 totalCalls 和 totalRequests', async () => {
      // Arrange
      const mockKeys = [{
        id: 'key-1',
        userId: mockUserId,
        totalCalls: 5000,
        totalTokens: 500000,
        crsKeyId: 'crs-1',
        name: 'Key',
        status: 'ACTIVE',
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]

      ;(keyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })
      ;(keyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 1,
      })

      // Act
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert - 模拟前端两种用法都可以工作
      const key = data.keys[0]

      // 旧代码使用 totalCalls
      expect(key.totalCalls).toBeDefined()
      expect(key.totalCalls).toBe(5000)

      // 新代码使用 totalRequests
      expect(key.totalRequests).toBeDefined()
      expect(key.totalRequests).toBe(5000)

      // 两者值相同
      expect(key.totalCalls).toBe(key.totalRequests)
    })

    it('即使 totalCalls 为 0，totalRequests 也应该正确', async () => {
      // Arrange
      const mockKeys = [{
        id: 'key-1',
        userId: mockUserId,
        totalCalls: 0,
        totalTokens: 0,
        crsKeyId: 'crs-1',
        name: 'Unused Key',
        status: 'INACTIVE',
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]

      ;(keyRepository.findByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: mockKeys,
      })
      ;(keyRepository.countByUserId as jest.Mock).mockResolvedValue({
        isSuccess: true,
        value: 1,
      })

      // Act
      const request = new Request('http://localhost:3000/api/keys', {
        method: 'GET',
      })
      const response = await GET(request)
      const data = await response.json()

      // Assert
      const key = data.keys[0]
      expect(key.totalCalls).toBe(0)
      expect(key.totalRequests).toBe(0)
      expect(key.totalCalls).toBe(key.totalRequests)
    })
  })

  describe('类型安全性测试', () => {
    it('totalRequests 应该是 number 类型而不是 BigInt', async () => {
      // Arrange
      const mockKey = {
        id: mockKeyId,
        userId: mockUserId,
        crsKeyId: 'crs-key-1',
        crsKey: 'cr_test',
        name: 'Test',
        status: 'ACTIVE',
        totalCalls: BigInt(12345),
        totalTokens: BigInt(1234500),
        description: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)

      // Act
      const request = new Request(`http://localhost:3000/api/keys/${mockKeyId}`, {
        method: 'GET',
      })
      const response = await GET_DETAIL(request, { params: { id: mockKeyId } })
      const data = await response.json()

      // Assert - 确保是number类型（JSON序列化友好）
      expect(typeof data.totalCalls).toBe('number')
      expect(typeof data.totalRequests).toBe('number')

      // 确保不是字符串
      expect(typeof data.totalCalls).not.toBe('string')
      expect(typeof data.totalRequests).not.toBe('string')

      // 确保不是BigInt（JSON不支持）
      expect(typeof data.totalCalls).not.toBe('bigint')
      expect(typeof data.totalRequests).not.toBe('bigint')
    })
  })
})
