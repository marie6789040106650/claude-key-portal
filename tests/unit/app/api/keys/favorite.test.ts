/**
 * Favorite API 路由测试
 * P1 阶段 - 收藏功能 🔴 RED
 *
 * 测试密钥收藏 API:
 * - PATCH /api/keys/[id]/favorite
 * - 更新收藏状态
 * - 权限验证
 * - 错误处理
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/keys/[id]/favorite/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth'

describe('PATCH /api/keys/[id]/favorite', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  }

  const mockKey = {
    id: 'key-1',
    userId: 'user-1',
    name: 'Test Key',
    isFavorite: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('成功场景', () => {
    it('应该能够设置收藏状态', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isFavorite).toBe(true)
    })

    it('应该能够取消收藏状态', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: true,
      })
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: false,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: false }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isFavorite).toBe(false)
    })

    it('应该调用正确的 Prisma 方法', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { isFavorite: true },
        select: {
          id: true,
          isFavorite: true,
          name: true,
        },
      })
    })

    it('应该返回更新后的密钥信息', async () => {
      const updatedKey = {
        id: 'key-1',
        name: 'Test Key',
        isFavorite: true,
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(data.key).toEqual(updatedKey)
    })
  })

  describe('权限验证', () => {
    it('未登录应该返回 401', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: '请先登录',
      })
    })

    it('访问他人密钥应该返回 403', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        ...mockKey,
        userId: 'other-user',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        error: '无权操作此密钥',
      })
    })

    it('密钥不存在应该返回 404', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        error: '密钥不存在',
      })
    })
  })

  describe('输入验证', () => {
    it('缺少 isFavorite 字段应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '缺少必填字段: isFavorite',
      })
    })

    it('isFavorite 不是布尔值应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: 'true' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'isFavorite 必须是布尔值',
      })
    })

    it('无效的 JSON 应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: 'invalid json',
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '无效的请求数据',
      })
    })
  })

  describe('错误处理', () => {
    it('数据库错误应该返回 500', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        error: '服务器错误，请稍后重试',
      })
    })

    it('应该记录错误日志', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update favorite status:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('并发处理', () => {
    it('应该正确处理并发请求', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: true,
      })

      const requests = Array(10)
        .fill(null)
        .map(() =>
          new NextRequest('http://localhost/api/keys/key-1/favorite', {
            method: 'PATCH',
            body: JSON.stringify({ isFavorite: true }),
          })
        )

      const responses = await Promise.all(
        requests.map((req) => PATCH(req, { params: { id: 'key-1' } }))
      )

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('审计日志', () => {
    it('应该记录操作到审计日志', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        isFavorite: true,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/favorite', {
        method: 'PATCH',
        body: JSON.stringify({ isFavorite: true }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      // TODO: 验证审计日志记录
      // expect(auditLog).toHaveBeenCalledWith({
      //   action: 'UPDATE_FAVORITE',
      //   resourceId: 'key-1',
      //   userId: 'user-1',
      // })
    })
  })
})
