/**
 * @jest-environment node
 */

/**
 * 通知记录 API 单元测试
 * 测试 GET /api/user/notifications (列表、详情、标记已读、删除)
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/user/notifications/route'
import { DELETE } from '@/app/api/user/notifications/route'

// Mock 依赖
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

describe('GET /api/user/notifications - 获取通知列表', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该返回分页的通知列表', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const mockNotifications = [
      {
        id: 'notif-1',
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING',
        title: 'API 速率限制警告',
        message: '您的 API Key 已达到80%速率限制',
        data: {
          apiKeyId: 'key-123',
          apiKeyName: 'Production Key',
          percentage: 80,
        },
        channel: 'email',
        status: 'SENT',
        sentAt: new Date('2025-10-03T10:00:00Z'),
        readAt: null,
        error: null,
        createdAt: new Date('2025-10-03T10:00:00Z'),
      },
      {
        id: 'notif-2',
        userId: 'user-123',
        type: 'KEY_CREATED',
        title: '新密钥创建成功',
        message: '密钥 "Test Key" 已创建',
        data: { apiKeyId: 'key-456' },
        channel: 'system',
        status: 'SENT',
        sentAt: new Date('2025-10-03T09:00:00Z'),
        readAt: new Date('2025-10-03T09:30:00Z'),
        error: null,
        createdAt: new Date('2025-10-03T09:00:00Z'),
      },
    ]

    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
    ;(prisma.notification.count as jest.Mock)
      .mockResolvedValueOnce(45) // total
      .mockResolvedValueOnce(5) // unreadCount

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications?page=1&limit=20',
      {
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notifications).toHaveLength(2)
    expect(data.notifications[0].id).toBe('notif-1')
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    })
    expect(data.unreadCount).toBe(5)

    // 验证查询参数
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    })
  })

  it('应该支持类型筛选', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications?type=RATE_LIMIT_WARNING',
      {
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    await GET(request)

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-123',
          type: 'RATE_LIMIT_WARNING',
        },
      })
    )
  })

  it('应该支持仅显示未读通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(0)

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications?unreadOnly=true',
      {
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    await GET(request)

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-123',
          readAt: null,
        },
      })
    )
  })

  it('应该处理无效的页码参数', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications?page=-1',
      {
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('页码必须大于 0')
  })

  it('应该处理无效的每页数量', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications?limit=200',
      {
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('每页数量不能超过 100')
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notifications')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})

describe('DELETE /api/user/notifications - 批量删除通知', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该删除所有已读通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 12 })

    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('已删除 12 条通知')
    expect(data.count).toBe(12)

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: { not: null },
      },
    })
  })

  it('应该支持按类型删除', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'SYSTEM_ANNOUNCEMENT',
      }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.count).toBe(5)

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: { not: null },
        type: 'SYSTEM_ANNOUNCEMENT',
      },
    })
  })

  it('应该支持按时间删除', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 8 })

    const beforeDate = '2025-10-01T00:00:00.000Z'
    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        before: beforeDate,
      }),
    })

    const response = await DELETE(request)

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: { not: null },
        createdAt: { lte: new Date(beforeDate) },
      },
    })
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.deleteMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/notifications', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})
