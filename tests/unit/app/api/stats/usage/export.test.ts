/**
 * P2.7 - CSV/JSON 导出功能测试
 *
 * 测试范围：
 * 1. CSV格式导出
 * 2. JSON格式导出
 * 3. 无效格式参数
 * 4. 空数据导出
 * 5. 带筛选条件的导出
 * 6. 元数据包含
 */

import { GET } from '@/app/api/stats/usage/export/route'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/tests/setup'
import { verifyAuth } from '@/lib/auth'

// Mock依赖
jest.mock('@/lib/auth')
const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>

describe('GET /api/stats/usage/export', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAuth.mockResolvedValue({ userId: mockUserId })
  })

  describe('CSV格式导出', () => {
    it('应该成功导出CSV格式的统计数据', async () => {
      // Arrange
      const mockData = [
        {
          id: 'key-1',
          name: 'Production Key',
          crsKey: 'sk-xxx',
          status: 'active',
          totalTokens: BigInt(10000),
          totalRequests: BigInt(100),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
          userId: mockUserId,
        },
        {
          id: 'key-2',
          name: 'Test Key',
          crsKey: 'sk-yyy',
          status: 'inactive',
          totalTokens: BigInt(500),
          totalRequests: BigInt(5),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-01-02'),
          userId: mockUserId,
        },
      ]

      prismaMock.apiKey.findMany.mockResolvedValue(mockData as any)

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=csv'
      )

      // Act
      const response = await GET(request)
      const text = await response.text()

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
      expect(response.headers.get('content-disposition')).toContain('attachment; filename="usage-stats-')

      // 验证CSV内容
      const lines = text.split('\n')
      expect(lines[0]).toBe('密钥名称,状态,总Token数,总请求数,创建时间,最后使用时间')
      expect(lines[1]).toContain('Production Key,active,10000,100,2024-01-01')
      expect(lines[2]).toContain('Test Key,inactive,500,5,2024-01-01')
    })

    it('应该正确处理CSV中的特殊字符（逗号、引号）', async () => {
      // Arrange
      const mockData = [
        {
          id: 'key-1',
          name: 'Test, "Special" Key',
          crsKey: 'sk-xxx',
          status: 'active',
          totalTokens: BigInt(1000),
          totalRequests: BigInt(10),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
          userId: mockUserId,
        },
      ]

      prismaMock.apiKey.findMany.mockResolvedValue(mockData as any)

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=csv'
      )

      // Act
      const response = await GET(request)
      const text = await response.text()

      // Assert
      expect(text).toContain('"Test, ""Special"" Key"')
    })
  })

  describe('JSON格式导出', () => {
    it('应该成功导出JSON格式的统计数据', async () => {
      // Arrange
      const mockData = [
        {
          id: 'key-1',
          name: 'Production Key',
          crsKey: 'sk-xxx',
          status: 'active',
          totalTokens: BigInt(10000),
          totalRequests: BigInt(100),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
          userId: mockUserId,
        },
      ]

      prismaMock.apiKey.findMany.mockResolvedValue(mockData as any)

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('content-disposition')).toContain('attachment; filename="usage-stats-')

      // 验证JSON结构
      expect(data).toHaveProperty('exportedAt')
      expect(data).toHaveProperty('userId', mockUserId)
      expect(data).toHaveProperty('totalCount', 1)
      expect(data).toHaveProperty('data')

      // 验证数据内容
      expect(data.data[0]).toMatchObject({
        id: 'key-1',
        name: 'Production Key',
        status: 'active',
        totalTokens: 10000,
        totalRequests: 100,
      })
    })

    it('应该在JSON中包含筛选条件元数据', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json&status=active&minTokens=1000'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.filters).toEqual({
        status: 'active',
        minTokens: '1000',
      })
    })
  })

  describe('参数验证', () => {
    it('应该拒绝无效的格式参数', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=xml'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('无效的导出格式，仅支持 csv 或 json')
    })

    it('应该在缺少format参数时默认为CSV', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export'
      )

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    })
  })

  describe('空数据处理', () => {
    it('应该正确导出空数据集（CSV）', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=csv'
      )

      // Act
      const response = await GET(request)
      const text = await response.text()

      // Assert
      expect(response.status).toBe(200)
      const lines = text.split('\n')
      expect(lines[0]).toBe('密钥名称,状态,总Token数,总请求数,创建时间,最后使用时间')
      expect(lines.length).toBe(1) // 只有表头
    })

    it('应该正确导出空数据集（JSON）', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.totalCount).toBe(0)
      expect(data.data).toEqual([])
    })
  })

  describe('筛选条件支持', () => {
    it('应该支持状态筛选', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json&status=active'
      )

      // Act
      await GET(request)

      // Assert
      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      )
    })

    it('应该支持Token数量筛选', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json&minTokens=1000&maxTokens=10000'
      )

      // Act
      await GET(request)

      // Assert
      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            totalTokens: {
              gte: BigInt(1000),
              lte: BigInt(10000),
            },
          }),
        })
      )
    })

    it('应该支持多条件组合筛选', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json&status=active&minTokens=1000&nameContains=test'
      )

      // Act
      await GET(request)

      // Assert
      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            status: 'active',
            totalTokens: expect.objectContaining({
              gte: BigInt(1000),
            }),
            name: expect.objectContaining({
              contains: 'test',
              mode: 'insensitive',
            }),
          }),
        })
      )
    })
  })

  describe('权限控制', () => {
    it('应该只导出当前用户的数据', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      await GET(request)

      // Assert
      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        })
      )
    })

    it('应该拒绝未认证的请求', async () => {
      // Arrange
      mockVerifyAuth.mockRejectedValue(new Error('未认证'))

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act & Assert
      await expect(GET(request)).rejects.toThrow('未认证')
    })
  })

  describe('文件名生成', () => {
    it('应该生成包含时间戳的文件名（CSV）', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=csv'
      )

      // Act
      const response = await GET(request)

      // Assert
      const contentDisposition = response.headers.get('content-disposition')
      expect(contentDisposition).toMatch(/usage-stats-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv/)
    })

    it('应该生成包含时间戳的文件名（JSON）', async () => {
      // Arrange
      prismaMock.apiKey.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      const response = await GET(request)

      // Assert
      const contentDisposition = response.headers.get('content-disposition')
      expect(contentDisposition).toMatch(/usage-stats-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/)
    })
  })

  describe('数据格式化', () => {
    it('应该正确格式化BigInt为普通数字', async () => {
      // Arrange
      const mockData = [
        {
          id: 'key-1',
          name: 'Test Key',
          crsKey: 'sk-xxx',
          status: 'active',
          totalTokens: BigInt('999999999999999'),
          totalRequests: BigInt('888888888888'),
          createdAt: new Date('2024-01-01'),
          lastUsedAt: new Date('2024-10-10'),
          userId: mockUserId,
        },
      ]

      prismaMock.apiKey.findMany.mockResolvedValue(mockData as any)

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(typeof data.data[0].totalTokens).toBe('number')
      expect(typeof data.data[0].totalRequests).toBe('number')
      expect(data.data[0].totalTokens).toBe(999999999999999)
      expect(data.data[0].totalRequests).toBe(888888888888)
    })

    it('应该正确格式化日期为ISO字符串', async () => {
      // Arrange
      const mockData = [
        {
          id: 'key-1',
          name: 'Test Key',
          crsKey: 'sk-xxx',
          status: 'active',
          totalTokens: BigInt(1000),
          totalRequests: BigInt(10),
          createdAt: new Date('2024-01-01T00:00:00Z'),
          lastUsedAt: new Date('2024-10-10T12:34:56Z'),
          userId: mockUserId,
        },
      ]

      prismaMock.apiKey.findMany.mockResolvedValue(mockData as any)

      const request = new NextRequest(
        'http://localhost:3000/api/stats/usage/export?format=json'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.data[0].createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(data.data[0].lastUsedAt).toBe('2024-10-10T12:34:56.000Z')
    })
  })
})
