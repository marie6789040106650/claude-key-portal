/**
 * 到期检查任务 单元测试
 *
 * 测试定时到期检查任务的功能：
 * - 检测即将到期的 API Key
 * - 发送到期提醒通知
 * - 记录提醒发送状态
 * - 避免重复提醒
 */

import { ExpirationCheckJob } from '@/lib/cron/jobs/expiration-check-job'
import { ExpirationCheckService } from '@/lib/services/expiration-check-service'
import { prisma } from '@/lib/prisma'

// Mock ExpirationCheckService
jest.mock('@/lib/services/expiration-check-service')

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
    },
    expirationReminder: {
      findFirst: jest.fn(),
    },
  },
}))

describe('ExpirationCheckJob', () => {
  let job: ExpirationCheckJob
  let mockCheckService: jest.Mocked<ExpirationCheckService>

  beforeEach(() => {
    jest.clearAllMocks()
    job = new ExpirationCheckJob()
    mockCheckService = (ExpirationCheckService as jest.Mock).mock.instances[0]
  })

  describe('任务配置', () => {
    it('应该有正确的任务名称', () => {
      expect(job.name).toBe('expiration-check')
    })

    it('应该配置为每日09:00执行', () => {
      expect(job.schedule).toBe('0 9 * * *')
    })

    it('应该有任务描述', () => {
      expect(job.description).toBe('检查即将到期的API Key并发送提醒')
    })
  })

  describe('任务执行', () => {
    it('应该调用到期检查服务', async () => {
      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)

      const result = await job.execute()

      expect(mockCheckService.checkExpirations).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('应该返回检查到的到期Key数量', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', expiresAt: new Date() },
        { id: 'key-2', name: 'Key 2', expiresAt: new Date() },
        { id: 'key-3', name: 'Key 3', expiresAt: new Date() },
      ]

      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysChecked).toBe(3)
    })

    it('应该返回发送的提醒数量', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', expiresAt: new Date() },
        { id: 'key-2', name: 'Key 2', expiresAt: new Date() },
      ]

      // 模拟只有第一个需要提醒
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationReminder.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // key-1 未提醒过
        .mockResolvedValueOnce({ id: 'reminder-1' }) // key-2 已提醒过

      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.remindersSent).toBe(1)
    })

    it('应该处理服务执行错误', async () => {
      const mockError = new Error('Service error')
      mockCheckService.checkExpirations = jest.fn().mockRejectedValue(mockError)

      const result = await job.execute()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service error')
    })

    it('应该返回执行时长', async () => {
      mockCheckService.checkExpirations = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 100)
          })
      )

      const startTime = Date.now()
      const result = await job.execute()
      const endTime = Date.now()

      expect(result.duration).toBeGreaterThanOrEqual(100)
      expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 10)
    })
  })

  describe('统计信息', () => {
    it('应该返回检查的时间范围', async () => {
      const now = new Date('2025-10-04T09:00:00.000Z')
      const threeDaysLater = new Date('2025-10-07T09:00:00.000Z')
      const sevenDaysLater = new Date('2025-10-11T09:00:00.000Z')
      const thirtyDaysLater = new Date('2025-11-03T09:00:00.000Z')

      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.checkRanges).toEqual({
        '3days': expect.any(String),
        '7days': expect.any(String),
        '30days': expect.any(String),
      })
    })

    it('应该按提醒类型分组统计', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Key 1',
          expiresAt: new Date('2025-10-07T09:00:00.000Z'), // 3天后
        },
        {
          id: 'key-2',
          name: 'Key 2',
          expiresAt: new Date('2025-10-11T09:00:00.000Z'), // 7天后
        },
        {
          id: 'key-3',
          name: 'Key 3',
          expiresAt: new Date('2025-11-03T09:00:00.000Z'), // 30天后
        },
      ]

      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.remindersByType).toEqual({
        '3_DAYS': 1,
        '7_DAYS': 1,
        '30_DAYS': 1,
      })
    })
  })

  describe('边界条件', () => {
    it('应该处理没有到期Key的情况', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])
      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.keysChecked).toBe(0)
      expect(result.remindersSent).toBe(0)
    })

    it('应该跳过已发送提醒的Key', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', expiresAt: new Date() },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue({
        id: 'reminder-1',
        apiKeyId: 'key-1',
      })

      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)

      const result = await job.execute()

      expect(result.success).toBe(true)
      expect(result.remindersSent).toBe(0)
      expect(result.skipped).toBe(1)
    })

    it('应该处理部分失败的情况', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', expiresAt: new Date() },
        { id: 'key-2', name: 'Key 2', expiresAt: new Date() },
      ]

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)

      // 模拟检查服务部分失败
      mockCheckService.checkExpirations = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed for key-1'))
        .mockResolvedValueOnce(undefined)

      const result = await job.execute()

      // 即使部分失败，任务应该继续
      expect(result.success).toBe(true)
      expect(result.failed).toBe(1)
      expect(result.remindersSent).toBeGreaterThan(0)
    })
  })

  describe('性能优化', () => {
    it('应该批量查询API Key', async () => {
      mockCheckService.checkExpirations = jest.fn().mockResolvedValue(undefined)

      await job.execute()

      // 应该只调用一次查询
      expect(prisma.apiKey.findMany).toHaveBeenCalledTimes(1)
    })

    it('应该并发处理多个Key', async () => {
      const mockKeys = Array.from({ length: 10 }, (_, i) => ({
        id: `key-${i}`,
        name: `Key ${i}`,
        expiresAt: new Date(),
      }))

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)

      let concurrentCalls = 0
      let maxConcurrent = 0

      mockCheckService.checkExpirations = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            concurrentCalls++
            maxConcurrent = Math.max(maxConcurrent, concurrentCalls)
            setTimeout(() => {
              concurrentCalls--
              resolve(undefined)
            }, 10)
          })
      )

      await job.execute()

      // 应该有并发调用
      expect(maxConcurrent).toBeGreaterThan(1)
    })
  })
})
