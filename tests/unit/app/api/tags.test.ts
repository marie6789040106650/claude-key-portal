/**
 * Tags List API 路由测试
 * P1 阶段 - 标签功能 🔴 RED
 *
 * 测试标签列表 API:
 * - GET /api/tags
 * - 获取用户所有标签
 * - 标签统计和排序
 * - 权限验证
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/tags/route'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth'

describe('GET /api/tags', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('成功场景', () => {
    it('应该返回用户所有标签', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['生产环境', '重要'] },
        { tags: ['测试环境', '重要'] },
        { tags: ['开发环境'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tags).toEqual(
        expect.arrayContaining(['生产环境', '测试环境', '开发环境', '重要'])
      )
    })

    it('应该去重标签', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['生产环境', '重要'] },
        { tags: ['生产环境', '紧急'] },
        { tags: ['生产环境'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      const productionCount = data.tags.filter(
        (tag: string) => tag === '生产环境'
      ).length
      expect(productionCount).toBe(1)
    })

    it('应该按使用频率排序', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['A', 'B'] },
        { tags: ['A', 'C'] },
        { tags: ['A', 'B', 'C'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      // A 出现 3 次，B 出现 2 次，C 出现 2 次
      // 应该按频率降序排列
      expect(data.tags[0]).toBe('A')
    })

    it('空标签数组应该返回空列表', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: [] },
        { tags: [] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags).toEqual([])
    })

    it('没有密钥应该返回空列表', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags).toEqual([])
    })

    it('应该只返回当前用户的标签', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['用户1标签'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      await GET(request)

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: { tags: true },
      })
    })

    it('应该包含标签统计信息', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['A', 'B'] },
        { tags: ['A', 'C'] },
        { tags: ['A'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(data.stats).toBeDefined()
      expect(data.stats).toMatchObject({
        total: 3, // 唯一标签数
        A: 3, // A 出现 3 次
        B: 1, // B 出现 1 次
        C: 1, // C 出现 1 次
      })
    })
  })

  describe('筛选功能', () => {
    it('应该支持搜索标签', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['生产环境', '测试环境', '开发环境'] },
      ])

      const request = new NextRequest(
        'http://localhost/api/tags?search=生产'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags).toContain('生产环境')
      expect(data.tags).not.toContain('测试环境')
      expect(data.tags).not.toContain('开发环境')
    })

    it('搜索应该不区分大小写', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['Production', 'Testing'] },
      ])

      const request = new NextRequest(
        'http://localhost/api/tags?search=production'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags).toContain('Production')
    })

    it('应该支持限制返回数量', async () => {
      const tags = Array(20)
        .fill(null)
        .map((_, i) => `标签${i}`)

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([{ tags }])

      const request = new NextRequest('http://localhost/api/tags?limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags.length).toBe(10)
    })

    it('应该支持排序选项', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['Z标签', 'A标签', 'M标签'] },
      ])

      // 按字母顺序
      const request = new NextRequest(
        'http://localhost/api/tags?sort=alphabetical'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(data.tags[0]).toBe('A标签')
      expect(data.tags[data.tags.length - 1]).toBe('Z标签')
    })
  })

  describe('缓存', () => {
    it('应该缓存标签列表', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['标签'] },
      ])

      const request1 = new NextRequest('http://localhost/api/tags')
      const response1 = await GET(request1)

      const request2 = new NextRequest('http://localhost/api/tags')
      const response2 = await GET(request2)

      // 第二次请求应该使用缓存
      expect(response1.headers.get('X-Cache')).toBe('MISS')
      expect(response2.headers.get('X-Cache')).toBe('HIT')
    })

    it('更新标签后应该清除缓存', async () => {
      // TODO: 实现缓存清除逻辑测试
    })
  })

  describe('权限验证', () => {
    it('未登录应该返回 401', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: '请先登录',
      })
    })

    it('已登录应该只返回自己的标签', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['我的标签'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      await GET(request)

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        })
      )
    })
  })

  describe('错误处理', () => {
    it('数据库错误应该返回 500', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        error: '服务器错误，请稍后重试',
      })
    })

    it('应该记录错误日志', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/tags')
      await GET(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch tags:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('无效的查询参数应该返回 400', async () => {
      const request = new NextRequest(
        'http://localhost/api/tags?limit=invalid'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'limit 必须是数字',
      })
    })
  })

  describe('性能', () => {
    it('大量标签应该正确处理', async () => {
      const manyTags = Array(1000)
        .fill(null)
        .map((_, i) => ({ tags: [`标签${i}`] }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(manyTags)

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tags.length).toBe(1000)
    })

    it('应该优化数据库查询', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['标签'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      await GET(request)

      // 只查询需要的字段
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: { tags: true },
      })
    })
  })

  describe('响应格式', () => {
    it('应该返回正确的数据结构', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
        { tags: ['标签1', '标签2'] },
      ])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('tags')
      expect(data).toHaveProperty('stats')
      expect(Array.isArray(data.tags)).toBe(true)
      expect(typeof data.stats).toBe('object')
    })

    it('应该设置正确的 Content-Type', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/tags')
      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toContain(
        'application/json'
      )
    })
  })
})
