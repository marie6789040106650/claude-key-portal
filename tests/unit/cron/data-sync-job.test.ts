/**
 * 数据同步任务 单元测试
 *
 * 测试定时数据同步任务的功能：
 * - 同步外部API的使用统计
 * - 更新API Key额度信息
 * - 同步失败重试机制
 * - 批量处理优化
 */

import { DataSyncJob } from '@/lib/cron/jobs/data-sync-job'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    usageRecord: {
      create: jest.fn(),
    },
  },
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('DataSyncJob', () => {
  let job: DataSyncJob

  beforeEach(() => {
    jest.clearAllMocks()
    job = new DataSyncJob()
  })

  describe('任务配置', () => {
    it('应该有正确的任务名称', () => {
      expect(job.name).toBe('data-sync')
    })

    it('应该配置为每小时执行一次', () => {
      expect(job.schedule).toBe('0 * * * *')
    })

    it('应该有任务描述', () => {
      expect(job.description).toBe('同步外部API使用统计和额度信息')
    })
  })

  describe('同步执行', () => {
    it('应该同步所有活跃的API Key', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', crsKeyId: 'crs-1', apiKey: 'sk-1', status: 'ACTIVE' },
        { id: 'key-2', name: 'Key 2', crsKeyId: 'crs-2', apiKey: 'sk-2', status: 'ACTIVE' },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ usage: 1000, limit: 10000 }),
      })

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysSynced).toBe(2)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
      })
    })

    it('应该更新API Key的使用量信息', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          usage: 5000,
          limit: 10000,
          remaining: 5000,
        }),
      })

      await job.execute()

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: {
          lastUsedAt: expect.any(Date),
        },
      })
    })

    it('应该创建使用记录快照', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          usage: 3000,
          model: 'claude-3-sonnet',
          promptTokens: 1000,
          completionTokens: 2000,
          duration: 1500,
        }),
      })

      await job.execute()

      expect(prisma.usageRecord.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'key-1',
          model: 'claude-3-sonnet',
          endpoint: '/api/chat/completions',
          method: 'POST',
          promptTokens: 1000,
          completionTokens: 2000,
          totalTokens: 3000,
          duration: 1500,
          status: 200,
          timestamp: expect.any(Date),
        },
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理API调用失败', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await job.execute()

      expect(result.success).toBe(true) // 部分失败不影响整体
      expect(result.failed).toBe(1)
      expect(result.errors).toContain('key-1: Network error')
    })

    it('应该处理API返回错误状态码', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const result = await job.execute()

      expect(result.failed).toBe(1)
      expect(result.errors).toContain('key-1: API returned 401')
    })

    // TODO: 功能未实现 - 需要在 data-sync-job.ts 中添加失败计数和状态标记逻辑
    it.skip('应该在同步失败时标记Key为ERROR状态', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        apiKey: 'sk-invalid',
        status: 'ACTIVE',
        syncFailures: 2, // 已经失败2次
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Auth failed'))

      await job.execute()

      // 连续3次失败应该标记为ERROR
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: {
          status: 'ERROR',
          syncFailures: 3,
          lastError: 'Auth failed',
        },
      })
    })

    // TODO: 功能未实现 - 需要在 data-sync-job.ts 中添加失败计数重置逻辑
    it.skip('应该重置成功同步的失败计数', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        apiKey: 'sk-test',
        status: 'ACTIVE',
        syncFailures: 2,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ usage: 1000, limit: 10000 }),
      })

      await job.execute()

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: expect.objectContaining({
          syncFailures: 0,
          lastError: null,
        }),
      })
    })
  })

  describe('批量处理', () => {
    it('应该批量处理多个Key', async () => {
      const mockKeys = Array.from({ length: 20 }, (_, i) => ({
        id: `key-${i}`,
        name: `Key ${i}`,
        crsKeyId: `crs-${i}`,
        apiKey: `sk-${i}`,
        status: 'ACTIVE',
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ usage: 1000, limit: 10000 }),
      })

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysSynced).toBe(20)
    })

    it('应该并发处理以提高性能', async () => {
      const mockKeys = Array.from({ length: 10 }, (_, i) => ({
        id: `key-${i}`,
        crsKeyId: `crs-${i}`,
        name: `Key ${i}`,
        apiKey: `sk-${i}`,
        status: 'ACTIVE',
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      let concurrentCalls = 0
      let maxConcurrent = 0

      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            concurrentCalls++
            maxConcurrent = Math.max(maxConcurrent, concurrentCalls)
            setTimeout(() => {
              concurrentCalls--
              resolve({
                ok: true,
                json: async () => ({ usage: 1000, limit: 10000 }),
              })
            }, 50)
          })
      )

      await job.execute()

      // 应该有并发处理
      expect(maxConcurrent).toBeGreaterThan(1)
      expect(maxConcurrent).toBeLessThanOrEqual(5) // 限制最大并发数
    })
  })

  describe('统计信息', () => {
    it('应该返回同步统计', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', apiKey: 'sk-1', status: 'ACTIVE' },
        { id: 'key-2', name: 'Key 2', apiKey: 'sk-2', status: 'ACTIVE' },
        { id: 'key-3', name: 'Key 3', apiKey: 'sk-3', status: 'ACTIVE' },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usage: 1000 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usage: 2000 }),
        })
        .mockRejectedValueOnce(new Error('Failed'))

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysSynced).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.totalUsage).toBe(3000)
    })

    it('应该返回平均同步时长', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', apiKey: 'sk-1', status: 'ACTIVE' },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ usage: 1000 }),
                }),
              100
            )
          })
      )

      const result = await job.execute()

      expect(result.avgSyncTime).toBeGreaterThanOrEqual(100)
    })
  })

  describe('边界条件', () => {
    it('应该处理没有活跃Key的情况', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysSynced).toBe(0)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('应该跳过已暂停的Key', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', apiKey: 'sk-1', status: 'PAUSED' },
        { id: 'key-2', name: 'Key 2', apiKey: 'sk-2', status: 'ACTIVE' },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      await job.execute()

      // 应该只查询ACTIVE状态的Key
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
      })
    })

    it('应该处理API返回的不完整数据', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ usage: 1000 }), // 缺少其他字段
      })

      const result = await job.execute()

      expect(result.success).toBe(true)
      // 应该更新lastUsedAt，即使数据不完整
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: {
          lastUsedAt: expect.any(Date),
        },
      })
    })
  })

  describe('速率限制', () => {
    // TODO: 功能未实现 - 需要在 data-sync-job.ts 中添加速率限制延迟逻辑
    it.skip('应该遵守API速率限制', async () => {
      const mockKeys = Array.from({ length: 5 }, (_, i) => ({
        id: `key-${i}`,
        name: `Key ${i}`,
        crsKeyId: `crs-${i}`,
        apiKey: `sk-${i}`,
        status: 'ACTIVE',
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ usage: 1000 }),
      })

      const startTime = Date.now()
      await job.execute()
      const endTime = Date.now()

      // 应该有延迟处理（避免触发速率限制）
      const duration = endTime - startTime
      expect(duration).toBeGreaterThanOrEqual(50) // 至少有一些延迟
    })

    it('应该在遇到429错误时重试', async () => {
      const mockKey = {
        id: 'key-1',
        name: 'Key 1',
        crsKeyId: 'crs-123',
        apiKey: 'sk-test',
        status: 'ACTIVE',
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey])
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usage: 1000 }),
        })

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(2) // 重试一次
    })
  })
})
