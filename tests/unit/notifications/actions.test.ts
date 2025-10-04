/**
 * @jest-environment node
 */

/**
 * 单个通知操作 API 单元测试
 * 测试 GET/DELETE /api/user/notifications/[id]
 * 测试 PUT /api/user/notifications/[id]/read
 * 测试 PUT /api/user/notifications/read-all
 */

import { NextRequest } from 'next/server'
import { GET, DELETE } from '@/app/api/user/notifications/[id]/route'
import { PUT as MarkRead } from '@/app/api/user/notifications/[id]/read/route'
import { PUT as MarkAllRead } from '@/app/api/user/notifications/read-all/route'

// Mock 依赖
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/user/notifications/[id] - 获取通知详情', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该返回通知详情', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      type: 'RATE_LIMIT_WARNING',
      title: 'API 速率限制警告',
      message: '您的 API Key 已达到80%速率限制',
      data: {
        apiKeyId: 'key-123',
        percentage: 80,
      },
      channel: 'email',
      status: 'SENT',
      sentAt: new Date('2025-10-03T10:00:00Z'),
      readAt: null,
      error: null,
      createdAt: new Date('2025-10-03T10:00:00Z'),
    }

    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification)

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-123', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('notif-123')
    expect(data.type).toBe('RATE_LIMIT_WARNING')

    expect(prisma.notification.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'notif-123',
        userId: 'user-123',
      },
    })
  })

  it('应该拒绝访问其他用户的通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-456', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request, { params: { id: 'notif-456' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('通知不存在')
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-123')

    const response = await GET(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })
})

describe('PUT /api/user/notifications/[id]/read - 标记为已读', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功标记通知为已读', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const mockUpdated = {
      id: 'notif-123',
      userId: 'user-123',
      readAt: new Date('2025-10-03T11:00:00Z'),
    }

    ;(prisma.notification.update as jest.Mock).mockResolvedValue(mockUpdated)

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications/notif-123/read',
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    const response = await MarkRead(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('通知已标记为已读')
    expect(data.readAt).toBeDefined()

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: {
        id: 'notif-123',
        userId: 'user-123',
      },
      data: {
        readAt: expect.any(Date),
      },
    })
  })

  it('应该拒绝访问其他用户的通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.update as jest.Mock).mockRejectedValue(
      new Error('Record to update not found')
    )

    const request = new NextRequest(
      'http://localhost:3000/api/user/notifications/notif-456/read',
      {
        method: 'PUT',
        headers: { Authorization: 'Bearer valid-token' },
      }
    )

    const response = await MarkRead(request, { params: { id: 'notif-456' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('通知不存在')
  })
})

describe('PUT /api/user/notifications/read-all - 批量标记已读', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该标记所有未读通知为已读', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 12 })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/read-all', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await MarkAllRead(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('已标记 12 条通知为已读')
    expect(data.count).toBe(12)

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: null,
      },
      data: {
        readAt: expect.any(Date),
      },
    })
  })

  it('应该支持按类型筛选', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/read-all', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'RATE_LIMIT_WARNING',
      }),
    })

    const response = await MarkAllRead(request)

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: null,
        type: 'RATE_LIMIT_WARNING',
      },
      data: {
        readAt: expect.any(Date),
      },
    })
  })

  it('应该支持按时间筛选', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 8 })

    const beforeDate = '2025-10-03T00:00:00.000Z'
    const request = new NextRequest('http://localhost:3000/api/user/notifications/read-all', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        before: beforeDate,
      }),
    })

    await MarkAllRead(request)

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        readAt: null,
        createdAt: { lte: new Date(beforeDate) },
      },
      data: {
        readAt: expect.any(Date),
      },
    })
  })

  it('应该处理没有未读通知的情况', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/read-all', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await MarkAllRead(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('已标记 0 条通知为已读')
    expect(data.count).toBe(0)
  })
})

describe('DELETE /api/user/notifications/[id] - 删除单个通知', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功删除通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.delete as jest.Mock).mockResolvedValue({
      id: 'notif-123',
    })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-123', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await DELETE(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('通知已删除')

    expect(prisma.notification.delete).toHaveBeenCalledWith({
      where: {
        id: 'notif-123',
        userId: 'user-123',
      },
    })
  })

  it('应该拒绝删除其他用户的通知', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.delete as jest.Mock).mockRejectedValue(
      new Error('Record to delete does not exist')
    )

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-456', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await DELETE(request, { params: { id: 'notif-456' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('通知不存在')
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.notification.delete as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/user/notifications/notif-123', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await DELETE(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})
