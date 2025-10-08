/**
 * Tags API 路由测试
 * P1 阶段 - 标签功能 🔴 RED
 *
 * 测试密钥标签 API:
 * - POST /api/keys/[id]/tags - 添加标签
 * - DELETE /api/keys/[id]/tags - 删除标签
 * - 标签验证和去重
 * - 权限验证
 */

import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/keys/[id]/tags/route'
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

describe('Tags API', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  }

  const mockKey = {
    id: 'key-1',
    userId: 'user-1',
    name: 'Test Key',
    tags: ['生产环境'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('POST /api/keys/[id]/tags', () => {
    describe('成功场景', () => {
      it('应该能够添加新标签', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境', '重要'],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '重要' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.tags).toEqual(['生产环境', '重要'])
      })

      it('应该能够添加多个标签', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境', '重要', '紧急'],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tags: ['重要', '紧急'] }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })
        const data = await response.json()

        expect(data.tags).toContain('重要')
        expect(data.tags).toContain('紧急')
      })

      it('应该自动去除首尾空格', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境', '空格标签'],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '  空格标签  ' }),
        })

        await POST(request, { params: { id: 'key-1' } })

        expect(prisma.apiKey.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { tags: expect.arrayContaining(['空格标签']) },
          })
        )
      })

      it('应该自动去重', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(mockKey)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '生产环境' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
          message: '标签已存在',
        })
      })

      it('应该返回更新后的标签列表', async () => {
        const updatedKey = {
          ...mockKey,
          tags: ['生产环境', '新标签'],
        }

        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '新标签' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })
        const data = await response.json()

        expect(data.tags).toEqual(updatedKey.tags)
      })
    })

    describe('输入验证', () => {
      it('缺少标签字段应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({}),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '缺少必填字段: tag 或 tags',
        })
      })

      it('空标签应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '标签不能为空',
        })
      })

      it('标签长度超限应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: 'a'.repeat(51) }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '标签最多 50 个字符',
        })
      })

      it('标签数量超限应该返回 400', async () => {
        const manyTags = Array(10).fill('标签')

        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: manyTags,
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '新标签' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '最多只能添加 10 个标签',
        })
      })

      it('标签不是字符串应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: 123 }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '标签必须是字符串',
        })
      })
    })

    describe('权限验证', () => {
      it('未登录应该返回 401', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(401)
      })

      it('访问他人密钥应该返回 403', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
          ...mockKey,
          userId: 'other-user',
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(403)
      })

      it('密钥不存在应该返回 404', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'POST',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await POST(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(404)
      })
    })
  })

  describe('DELETE /api/keys/[id]/tags', () => {
    describe('成功场景', () => {
      it('应该能够删除标签', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境', '测试环境'],
        })
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境'],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '测试环境' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.tags).toEqual(['生产环境'])
      })

      it('删除不存在的标签应该返回成功', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(mockKey)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '不存在的标签' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
          message: '标签不存在',
        })
      })

      it('应该能够删除所有标签', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: [],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '生产环境' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })
        const data = await response.json()

        expect(data.tags).toEqual([])
      })

      it('应该调用正确的 Prisma 方法', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境', '测试环境'],
        })
        ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
          ...mockKey,
          tags: ['生产环境'],
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '测试环境' }),
        })

        await DELETE(request, { params: { id: 'key-1' } })

        expect(prisma.apiKey.update).toHaveBeenCalledWith({
          where: { id: 'key-1' },
          data: { tags: ['生产环境'] },
          select: {
            id: true,
            tags: true,
          },
        })
      })
    })

    describe('输入验证', () => {
      it('缺少标签字段应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({}),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
          error: '缺少必填字段: tag',
        })
      })

      it('标签不是字符串应该返回 400', async () => {
        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: 123 }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(400)
      })
    })

    describe('权限验证', () => {
      it('未登录应该返回 401', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(401)
      })

      it('访问他人密钥应该返回 403', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
          ...mockKey,
          userId: 'other-user',
        })

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(403)
      })

      it('密钥不存在应该返回 404', async () => {
        ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
          method: 'DELETE',
          body: JSON.stringify({ tag: '标签' }),
        })

        const response = await DELETE(request, { params: { id: 'key-1' } })

        expect(response.status).toBe(404)
      })
    })
  })

  describe('错误处理', () => {
    it('数据库错误应该返回 500', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
        method: 'POST',
        body: JSON.stringify({ tag: '标签' }),
      })

      const response = await POST(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(500)
    })

    it('应该记录错误日志', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/keys/key-1/tags', {
        method: 'POST',
        body: JSON.stringify({ tag: '标签' }),
      })

      await POST(request, { params: { id: 'key-1' } })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
