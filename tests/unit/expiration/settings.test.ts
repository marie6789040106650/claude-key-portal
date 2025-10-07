/**
 * @jest-environment node
 */

/**
 * 到期提醒配置 API 单元测试
 * 测试 GET/PUT /api/user/expiration-settings
 */

import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/user/expiration-settings/route'

// Mock 依赖
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    expirationSetting: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

describe('GET /api/user/expiration-settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该返回用户的到期提醒配置', async () => {
    // Mock 认证成功
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    // Mock 数据库查询
    const mockSettings = {
      id: 'settings-123',
      userId: 'user-123',
      reminderDays: [7, 3, 1],
      notifyChannels: ['email', 'system'],
      enabled: true,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-03'),
    }
    ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)

    // 创建请求
    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
      id: 'settings-123',
      userId: 'user-123',
      reminderDays: [7, 3, 1],
      notifyChannels: ['email', 'system'],
      enabled: true,
    })
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()

    // 验证数据库调用
    expect(prisma.expirationSetting.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
  })

  it('应该在配置不存在时创建默认配置', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    // Mock 查询返回 null（配置不存在）
    ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(null)

    // Mock 创建默认配置
    const mockDefaultSettings = {
      id: 'settings-new',
      userId: 'user-123',
      reminderDays: [7, 3, 1], // 默认提前 7、3、1 天提醒
      notifyChannels: ['system'], // 默认仅系统通知
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    ;(prisma.expirationSetting.create as jest.Mock).mockResolvedValue(mockDefaultSettings)

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('settings-new')
    expect(data.reminderDays).toEqual([7, 3, 1])
    expect(data.notifyChannels).toEqual(['system'])
    expect(data.enabled).toBe(true)

    // 验证创建了默认配置
    expect(prisma.expirationSetting.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        reminderDays: [7, 3, 1],
        notifyChannels: ['system'],
        enabled: true,
      }),
    })
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.expirationSetting.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})

describe('PUT /api/user/expiration-settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功更新到期提醒配置', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const updateData = {
      reminderDays: [14, 7, 3],
      notifyChannels: ['email', 'webhook', 'system'],
      enabled: true,
    }

    const mockUpdatedSettings = {
      id: 'settings-123',
      userId: 'user-123',
      ...updateData,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date(),
    }

    ;(prisma.expirationSetting.update as jest.Mock).mockResolvedValue(mockUpdatedSettings)

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.reminderDays).toEqual([14, 7, 3])
    expect(data.notifyChannels).toEqual(['email', 'webhook', 'system'])
    expect(data.enabled).toBe(true)

    expect(prisma.expirationSetting.update).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      data: updateData,
    })
  })

  it('应该成功禁用到期提醒', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const updateData = {
      enabled: false,
    }

    const mockUpdatedSettings = {
      id: 'settings-123',
      userId: 'user-123',
      reminderDays: [7, 3, 1],
      notifyChannels: ['email'],
      enabled: false,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date(),
    }

    ;(prisma.expirationSetting.update as jest.Mock).mockResolvedValue(mockUpdatedSettings)

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.enabled).toBe(false)
  })

  it('应该验证提醒天数范围（1-30天）', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      reminderDays: [0, 7, 35], // 0 和 35 超出范围
      notifyChannels: ['email'],
      enabled: true,
    }

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.error).toMatch(/提醒天数.*1.*30|天数.*范围/)
  })

  it('应该验证至少有一个提醒天数', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      reminderDays: [],
      notifyChannels: ['email'],
      enabled: true,
    }

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.error).toContain('至少需要设置一个提醒天数')
  })

  it('应该验证至少有一个通知渠道', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      reminderDays: [7, 3, 1],
      notifyChannels: [],
      enabled: true,
    }

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.error).toContain('至少需要选择一个通知渠道')
  })

  it('应该验证通知渠道的有效性', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      reminderDays: [7],
      notifyChannels: ['email', 'invalid-channel'],
      enabled: true,
    }

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.error).toMatch(/无效.*通知渠道|通知渠道.*有效/)
  })

  it('应该验证提醒天数为正整数', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const invalidData = {
      reminderDays: [7.5, -3, 1],
      notifyChannels: ['email'],
      enabled: true,
    }

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.error).toMatch(/提醒天数.*整数|必须.*正整数/)
  })

  it('应该自动去重提醒天数', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })

    const updateData = {
      reminderDays: [7, 3, 7, 1, 3], // 包含重复值
      notifyChannels: ['email'],
      enabled: true,
    }

    const mockUpdatedSettings = {
      id: 'settings-123',
      userId: 'user-123',
      reminderDays: [7, 3, 1], // 去重后
      notifyChannels: ['email'],
      enabled: true,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date(),
    }

    ;(prisma.expirationSetting.update as jest.Mock).mockResolvedValue(mockUpdatedSettings)

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
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
    expect(data.reminderDays).toEqual([7, 3, 1])
  })

  it('应该拒绝未认证的请求', async () => {
    ;(verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token无效或已过期')
    })

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Token无效或已过期')
  })

  it('应该处理数据库更新错误', async () => {
    ;(verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123' })
    ;(prisma.expirationSetting.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/user/expiration-settings', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('系统错误，请稍后重试')
  })
})
