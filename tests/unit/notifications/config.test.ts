/**
 * @jest-environment node
 */

/**
 * 通知配置 API 单元测试
 * 测试 GET/PUT /api/user/notification-config
 */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PUT } from '@/app/api/user/notification-config/route'

// Mock 依赖
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/user/notification-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该返回用户的通知配置', async () => {
    // Mock 认证成功
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    // Mock 数据库查询
    const mockConfig = {
      id: 'config-123',
      userId: 'user-123',
      channels: {
        email: {
          enabled: true,
          address: 'user@example.com',
        },
        webhook: {
          enabled: false,
          url: 'https://example.com/webhook',
        },
        system: {
          enabled: true,
        },
      },
      rules: [
        {
          type: 'RATE_LIMIT_WARNING',
          enabled: true,
          threshold: 80,
          channels: ['email', 'system'],
        },
      ],
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-03'),
    }
    ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
      mockConfig
    )

    // 创建请求
    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    })

    // 调用 API
    const response = await GET(request)
    const data = await response.json()

    // 验证响应
    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      id: 'config-123',
      userId: 'user-123',
      channels: mockConfig.channels,
      rules: mockConfig.rules,
    })
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()

    // 验证数据库调用
    expect(prisma.notificationConfig.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
  })

  it('应该在配置不存在时创建默认配置', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    // Mock 查询返回 null（配置不存在）
    ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(null)

    // Mock 创建配置
    const mockDefaultConfig = {
      id: 'config-new',
      userId: 'user-123',
      channels: {
        email: {
          enabled: false,
          address: '',
        },
        webhook: {
          enabled: false,
          url: '',
        },
        system: {
          enabled: true,
        },
      },
      rules: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    ;(prisma.notificationConfig.create as jest.Mock).mockResolvedValue(
      mockDefaultConfig
    )

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('config-new')
    expect(data.channels.system.enabled).toBe(true)

    // 验证创建了默认配置
    expect(prisma.notificationConfig.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
      }),
    })
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notification-config')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notificationConfig.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})

describe('PUT /api/user/notification-config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功更新通知配置', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const updateData = {
      channels: {
        email: {
          enabled: true,
          address: 'newemail@example.com',
        },
        webhook: {
          enabled: true,
          url: 'https://api.example.com/webhook',
          secret: 'webhook_secret',
        },
        system: {
          enabled: true,
        },
      },
      rules: [
        {
          type: 'RATE_LIMIT_WARNING',
          enabled: true,
          threshold: 75,
          channels: ['email'],
        },
      ],
    }

    const mockUpdatedConfig = {
      id: 'config-123',
      userId: 'user-123',
      ...updateData,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date(),
    }

    ;(prisma.notificationConfig.update as jest.Mock).mockResolvedValue(
      mockUpdatedConfig
    )

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.channels.email.address).toBe('newemail@example.com')
    expect(data.channels.webhook.enabled).toBe(true)
    expect(data.rules[0].threshold).toBe(75)

    expect(prisma.notificationConfig.update).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      data: updateData,
    })
  })

  it('应该验证邮箱地址格式', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      channels: {
        email: {
          enabled: true,
          address: 'invalid-email',
        },
      },
      rules: [],
    }

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('邮箱地址格式不正确')
  })

  it('应该验证 Webhook URL 格式', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      channels: {
        webhook: {
          enabled: true,
          url: 'http://insecure.com',
        },
      },
      rules: [],
    }

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Webhook URL 必须使用 HTTPS')
  })

  it('应该验证阈值范围（0-100）', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      channels: {
        system: { enabled: true },
      },
      rules: [
        {
          type: 'RATE_LIMIT_WARNING',
          enabled: true,
          threshold: 150, // 超出范围
          channels: ['system'],
        },
      ],
    }

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('阈值必须在 0-100 之间')
  })

  it('应该要求至少启用一个通知渠道', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      channels: {
        email: { enabled: false },
        webhook: { enabled: false },
        system: { enabled: false },
      },
      rules: [],
    }

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('至少需要启用一个通知渠道')
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: {}, rules: [] }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库更新错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notificationConfig.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/notification-config', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels: { system: { enabled: true } },
        rules: [],
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})
