/**
 * Notes API 路由测试
 * P1 阶段 - 备注功能 🔴 RED
 *
 * 测试密钥备注 API:
 * - PATCH /api/keys/[id]/notes
 * - 更新备注内容
 * - 字符限制验证
 * - 权限验证
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/keys/[id]/notes/route'
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

describe('PATCH /api/keys/[id]/notes', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  }

  const mockKey = {
    id: 'key-1',
    userId: 'user-1',
    name: 'Test Key',
    description: '原始备注',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('成功场景', () => {
    it('应该能够更新备注', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: '新的备注内容',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '新的备注内容' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.description).toBe('新的备注内容')
    })

    it('应该能够清空备注', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: '',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBe('')
    })

    it('应该能够设置 null 备注', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: null,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: null }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBeNull()
    })

    it('应该调用正确的 Prisma 方法', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: '测试备注',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '测试备注' }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { description: '测试备注' },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
      })
    })

    it('应该返回更新后的密钥信息', async () => {
      const updatedKey = {
        id: 'key-1',
        name: 'Test Key',
        description: '更新的备注',
        updatedAt: new Date(),
      }

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue(updatedKey)

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '更新的备注' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(data.key).toMatchObject({
        id: updatedKey.id,
        name: updatedKey.name,
        description: updatedKey.description,
      })
    })
  })

  describe('权限验证', () => {
    it('未登录应该返回 401', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '备注' }),
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

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '备注' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        error: '无权操作此密钥',
      })
    })

    it('密钥不存在应该返回 404', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '备注' }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        error: '密钥不存在',
      })
    })
  })

  describe('输入验证', () => {
    it('缺少 description 字段应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '缺少必填字段: description',
      })
    })

    it('description 不是字符串或 null 应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: 123 }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'description 必须是字符串或 null',
      })
    })

    it('超过最大长度应该返回 400', async () => {
      const longDescription = 'a'.repeat(1001)

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: longDescription }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: '备注最多 1000 个字符',
      })
    })

    it('应该自动去除首尾空格', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: '去除空格',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '  去除空格  ' }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { description: '去除空格' },
        })
      )
    })

    it('无效的 JSON 应该返回 400', async () => {
      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
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

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '备注' }),
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

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '备注' }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update notes:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Markdown 支持', () => {
    it('应该支持 Markdown 格式', async () => {
      const markdown = '# 标题\n\n这是**粗体**文本'

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: markdown,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: markdown }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBe(markdown)
    })

    it('应该支持多行文本', async () => {
      const multiline = '第一行\n第二行\n第三行'

      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: multiline,
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: multiline }),
      })

      const response = await PATCH(request, { params: { id: 'key-1' } })
      const data = await response.json()

      expect(data.description).toBe(multiline)
    })
  })

  describe('并发处理', () => {
    it('应该正确处理并发更新', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({
          ...mockKey,
          description: data.description,
        })
      )

      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          new NextRequest('http://localhost/api/keys/key-1/notes', {
            method: 'PATCH',
            body: JSON.stringify({ description: `备注${i}` }),
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
    it('应该记录备注更新操作', async () => {
      ;(prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey)
      ;(prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...mockKey,
        description: '新备注',
      })

      const request = new NextRequest('http://localhost/api/keys/key-1/notes', {
        method: 'PATCH',
        body: JSON.stringify({ description: '新备注' }),
      })

      await PATCH(request, { params: { id: 'key-1' } })

      // TODO: 验证审计日志记录
      // expect(auditLog).toHaveBeenCalledWith({
      //   action: 'UPDATE_NOTES',
      //   resourceId: 'key-1',
      //   userId: 'user-1',
      //   oldValue: '原始备注',
      //   newValue: '新备注',
      // })
    })
  })
})
