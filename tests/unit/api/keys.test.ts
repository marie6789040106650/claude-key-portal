/**
 * @jest-environment node
 */

/**
 * API 路由测试 - /api/keys
 * Sprint 12 - Phase 7 补充测试
 *
 * 测试所有密钥管理 API 端点:
 * - GET /api/keys - 获取密钥列表
 * - POST /api/keys - 创建新密钥
 * - PATCH /api/keys/:id - 更新密钥
 * - DELETE /api/keys/:id - 删除密钥
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/keys/route'
import { PATCH, DELETE } from '@/app/api/keys/[id]/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'
import * as auth from '@/lib/auth'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/crs-client', () => ({
  crsClient: {
    createKey: jest.fn(),
    updateKey: jest.fn(),
    deleteKey: jest.fn(),
    listKeys: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

describe('GET /api/keys', () => {
  const mockUserId = 'user-123'
  const mockKeys = [
    {
      id: 'key-1',
      userId: mockUserId,
      crsKeyId: 'crs-key-1',
      crsKey: 'sk-ant-abc123def456',
      name: 'Test Key 1',
      description: 'Test description',
      status: 'ACTIVE',
      tags: ['test'],
      totalTokens: 1000,
      totalCalls: 50,
      createdAt: new Date('2025-01-01'),
      lastUsedAt: new Date('2025-01-02'),
      expiresAt: null,
    },
    {
      id: 'key-2',
      userId: mockUserId,
      crsKeyId: 'crs-key-2',
      crsKey: 'sk-ant-xyz789ghi012',
      name: 'Test Key 2',
      description: null,
      status: 'INACTIVE',
      tags: [],
      totalTokens: 500,
      totalCalls: 25,
      createdAt: new Date('2025-01-03'),
      lastUsedAt: null,
      expiresAt: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth.verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })
  })

  it('应该返回密钥列表', async () => {
    ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
    ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(2)

    const request = new NextRequest('http://localhost/api/keys', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.keys).toHaveLength(2)
    expect(data.total).toBe(2)
    expect(data.keys[0].keyMasked).toBe('sk-ant-***f456')
    expect(data.keys[0].keyPrefix).toBe('sk-ant-')
  })

  it('应该处理分页参数', async () => {
    ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKeys[0]])
    ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(10)

    const request = new NextRequest('http://localhost/api/keys?page=2&limit=1', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.limit).toBe(1)
    expect(data.totalPages).toBe(10)
    expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      })
    )
  })

  it('应该验证分页参数范围', async () => {
    const request = new NextRequest('http://localhost/api/keys?limit=200', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('limit')
  })

  it('应该支持状态过滤', async () => {
    ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKeys[0]])
    ;(prisma.apiKey.count as jest.Mock).mockResolvedValue(1)

    const request = new NextRequest('http://localhost/api/keys?status=ACTIVE', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    )
  })

  it('应该验证无效的状态参数', async () => {
    const request = new NextRequest('http://localhost/api/keys?status=INVALID', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('状态参数')
  })

  it('应该拒绝未授权请求', async () => {
    ;(auth.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const request = new NextRequest('http://localhost/api/keys', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid token')
  })

  it('应该处理数据库错误', async () => {
    ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost/api/keys', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('系统错误')
  })
})

describe('POST /api/keys', () => {
  const mockUserId = 'user-123'
  const mockCrsKey = {
    id: 'crs-key-new',
    key: 'sk-ant-new123456789',
    name: 'New Test Key',
    status: 'ACTIVE',
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth.verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })
  })

  it('应该创建新密钥', async () => {
    ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
    ;(crsClient.createKey as jest.Mock).mockResolvedValue(mockCrsKey)
    ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({
      id: 'local-key-1',
      userId: mockUserId,
      crsKeyId: mockCrsKey.id,
      crsKey: mockCrsKey.key,
      name: mockCrsKey.name,
      description: null,
      status: mockCrsKey.status,
      tags: [],
      totalTokens: 0,
      totalCalls: 0,
      createdAt: mockCrsKey.createdAt,
      lastUsedAt: null,
      expiresAt: null,
    })

    const request = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Test Key',
        description: 'Test description',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.key.name).toBe('New Test Key')
    expect(data.key.keyValue).toBe(mockCrsKey.key)
    expect(crsClient.createKey).toHaveBeenCalled()
    expect(prisma.apiKey.create).toHaveBeenCalled()
  })

  it('应该验证必填字段', async () => {
    const request = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('名称')
  })

  it('应该检测重复的密钥名称', async () => {
    ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-key',
      name: 'Existing Key',
    })

    const request = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Existing Key',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('已存在')
  })

  it('应该处理 CRS 创建失败', async () => {
    ;(prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null)
    ;(crsClient.createKey as jest.Mock).mockRejectedValue(
      new Error('CRS service unavailable')
    )

    const request = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Key',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('CRS')
  })

  it('应该拒绝无效的 JSON', async () => {
    const request = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('JSON')
  })
})

describe('PATCH /api/keys/:id', () => {
  const mockUserId = 'user-123'
  const mockKeyId = 'key-123'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth.verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })
  })

  it('应该更新密钥', async () => {
    const existingKey = {
      id: mockKeyId,
      userId: mockUserId,
      crsKeyId: 'crs-key-123',
      crsKey: 'sk-ant-test123456',
      name: 'Old Name',
      status: 'ACTIVE',
      description: null,
      tags: [],
      totalTokens: 0,
      totalCalls: 0,
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt: null,
    }

    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
    ;(crsClient.updateKey as jest.Mock).mockResolvedValue({ success: true })
    ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
      ...existingKey,
      name: 'New Name',
    })

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Name',
      }),
    })

    const response = await PATCH(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.key.name).toBe('New Name')
    expect(crsClient.updateKey).toHaveBeenCalledWith(
      'crs-key-123',
      expect.objectContaining({ name: 'New Name' })
    )
  })

  it('应该返回 404 如果密钥不存在', async () => {
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Name',
      }),
    })

    const response = await PATCH(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('不存在')
  })

  it('应该验证用户权限', async () => {
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: mockKeyId,
      userId: 'other-user',
      crsKeyId: 'crs-key-123',
    })

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Name',
      }),
    })

    const response = await PATCH(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('权限')
  })
})

describe('DELETE /api/keys/:id', () => {
  const mockUserId = 'user-123'
  const mockKeyId = 'key-123'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth.verifyToken as jest.Mock).mockReturnValue({ userId: mockUserId })
  })

  it('应该删除密钥', async () => {
    const existingKey = {
      id: mockKeyId,
      userId: mockUserId,
      crsKeyId: 'crs-key-123',
    }

    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(existingKey)
    ;(crsClient.deleteKey as jest.Mock).mockResolvedValue({ success: true })
    ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
      ...existingKey,
      status: 'DELETED',
    })

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await DELETE(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(crsClient.deleteKey).toHaveBeenCalledWith('crs-key-123')
    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: mockKeyId },
      data: { status: 'DELETED' },
    })
  })

  it('应该返回 404 如果密钥不存在', async () => {
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await DELETE(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('不存在')
  })

  it('应该处理 CRS 删除失败', async () => {
    ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: mockKeyId,
      userId: mockUserId,
      crsKeyId: 'crs-key-123',
      status: 'ACTIVE',
    })

    // 创建符合 CRS 错误处理的错误对象
    const crsError = new Error('CRS service unavailable')
    crsError.name = 'CrsUnavailableError'
    ;(crsClient.deleteKey as jest.Mock).mockRejectedValue(crsError)

    const request = new NextRequest(`http://localhost/api/keys/${mockKeyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    const response = await DELETE(request, { params: { id: mockKeyId } })
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('CRS')
  })
})
