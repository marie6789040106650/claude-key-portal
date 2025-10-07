/**
 * Cron Runner 单元测试
 *
 * 测试 Cron Job 执行器的核心功能：
 * - 任务注册和调度
 * - 并发任务处理
 * - 执行日志记录
 * - 任务失败处理
 */

import { CronRunner, CronJob, CronJobResult } from '@/lib/cron/cron-runner'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((expression, callback) => {
    return {
      stop: jest.fn(),
      start: jest.fn(),
    }
  }),
  validate: jest.fn((expression) => true),
}))

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    cronJobLog: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('CronRunner', () => {
  let cronRunner: CronRunner
  const mockCron = require('node-cron')

  beforeEach(() => {
    jest.clearAllMocks()
    cronRunner = new CronRunner()
  })

  afterEach(() => {
    cronRunner.stopAll()
  })

  describe('任务注册', () => {
    it('应该能够注册定时任务', () => {
      const job: CronJob = {
        name: 'test-job',
        schedule: '0 9 * * *',
        handler: jest.fn(),
      }

      cronRunner.register(job)

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 9 * * *',
        expect.any(Function)
      )
    })

    it('应该验证 cron 表达式格式', () => {
      mockCron.validate.mockReturnValueOnce(false)

      const job: CronJob = {
        name: 'invalid-job',
        schedule: 'invalid',
        handler: jest.fn(),
      }

      expect(() => cronRunner.register(job)).toThrow('Invalid cron expression')
    })

    it('应该阻止重复注册同名任务', () => {
      const job1: CronJob = {
        name: 'duplicate-job',
        schedule: '0 9 * * *',
        handler: jest.fn(),
      }

      const job2: CronJob = {
        name: 'duplicate-job',
        schedule: '0 10 * * *',
        handler: jest.fn(),
      }

      cronRunner.register(job1)

      expect(() => cronRunner.register(job2)).toThrow(
        'Job duplicate-job is already registered'
      )
    })
  })

  describe('任务执行', () => {
    it('应该执行任务并记录成功日志', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true })
      const mockCreateLog = jest.fn().mockResolvedValue({
        id: 'log-1',
        jobName: 'test-job',
        status: 'RUNNING',
        startAt: new Date(),
      })
      const mockUpdateLog = jest.fn()

      ;(prisma.cronJobLog.create as jest.Mock) = mockCreateLog
      ;(prisma.cronJobLog.update as jest.Mock) = mockUpdateLog

      const job: CronJob = {
        name: 'test-job',
        schedule: '* * * * *',
        handler: mockHandler,
      }

      await cronRunner.executeJob(job)

      // 检查创建日志
      expect(mockCreateLog).toHaveBeenCalledWith({
        data: {
          jobName: 'test-job',
          status: 'RUNNING',
          startAt: expect.any(Date),
        },
      })

      // 检查执行handler
      expect(mockHandler).toHaveBeenCalled()

      // 检查更新日志为成功
      expect(mockUpdateLog).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: {
          status: 'SUCCESS',
          endAt: expect.any(Date),
          duration: expect.any(Number),
          result: { success: true },
        },
      })
    })

    it('应该捕获任务执行错误并记录失败日志', async () => {
      const mockError = new Error('Task failed')
      const mockHandler = jest.fn().mockRejectedValue(mockError)
      const mockCreateLog = jest.fn().mockResolvedValue({
        id: 'log-2',
        jobName: 'failing-job',
        status: 'RUNNING',
      })
      const mockUpdateLog = jest.fn()

      ;(prisma.cronJobLog.create as jest.Mock) = mockCreateLog
      ;(prisma.cronJobLog.update as jest.Mock) = mockUpdateLog

      const job: CronJob = {
        name: 'failing-job',
        schedule: '* * * * *',
        handler: mockHandler,
      }

      await cronRunner.executeJob(job)

      expect(mockUpdateLog).toHaveBeenCalledWith({
        where: { id: 'log-2' },
        data: {
          status: 'FAILED',
          endAt: expect.any(Date),
          duration: expect.any(Number),
          error: 'Task failed',
        },
      })
    })

    it('应该正确计算任务执行时长', async () => {
      const mockHandler = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100)
          })
      )

      const mockCreateLog = jest.fn().mockResolvedValue({
        id: 'log-3',
        jobName: 'timed-job',
      })
      const mockUpdateLog = jest.fn()

      ;(prisma.cronJobLog.create as jest.Mock) = mockCreateLog
      ;(prisma.cronJobLog.update as jest.Mock) = mockUpdateLog

      const job: CronJob = {
        name: 'timed-job',
        schedule: '* * * * *',
        handler: mockHandler,
      }

      await cronRunner.executeJob(job)

      const updateCall = mockUpdateLog.mock.calls[0][0]
      expect(updateCall.data.duration).toBeGreaterThanOrEqual(100)
    })
  })

  describe('并发控制', () => {
    it('应该阻止同一任务并发执行', async () => {
      const mockHandler = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 200)
          })
      )

      ;(prisma.cronJobLog.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'log-4',
        jobName: 'concurrent-job',
      })
      ;(prisma.cronJobLog.update as jest.Mock) = jest.fn()

      const job: CronJob = {
        name: 'concurrent-job',
        schedule: '* * * * *',
        handler: mockHandler,
      }

      // 同时执行两次
      const promise1 = cronRunner.executeJob(job)
      const promise2 = cronRunner.executeJob(job)

      await Promise.all([promise1, promise2])

      // handler应该只被调用一次
      expect(mockHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('任务管理', () => {
    it('应该能够停止所有任务', () => {
      const mockStop = jest.fn()
      mockCron.schedule.mockReturnValue({
        stop: mockStop,
        start: jest.fn(),
      })

      const job1: CronJob = {
        name: 'job-1',
        schedule: '0 9 * * *',
        handler: jest.fn(),
      }

      const job2: CronJob = {
        name: 'job-2',
        schedule: '0 10 * * *',
        handler: jest.fn(),
      }

      cronRunner.register(job1)
      cronRunner.register(job2)

      cronRunner.stopAll()

      expect(mockStop).toHaveBeenCalledTimes(2)
    })

    it('应该能够获取已注册任务列表', () => {
      const job1: CronJob = {
        name: 'job-1',
        schedule: '0 9 * * *',
        handler: jest.fn(),
      }

      const job2: CronJob = {
        name: 'job-2',
        schedule: '0 10 * * *',
        handler: jest.fn(),
      }

      cronRunner.register(job1)
      cronRunner.register(job2)

      const jobs = cronRunner.getRegisteredJobs()

      expect(jobs).toHaveLength(2)
      expect(jobs).toContain('job-1')
      expect(jobs).toContain('job-2')
    })

    it('应该能够手动触发任务', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true })

      ;(prisma.cronJobLog.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'log-5',
        jobName: 'manual-job',
      })
      ;(prisma.cronJobLog.update as jest.Mock) = jest.fn()

      const job: CronJob = {
        name: 'manual-job',
        schedule: '0 9 * * *',
        handler: mockHandler,
      }

      cronRunner.register(job)

      await cronRunner.runManually('manual-job')

      expect(mockHandler).toHaveBeenCalled()
    })

    it('应该在手动触发不存在的任务时抛出错误', async () => {
      await expect(cronRunner.runManually('non-existent')).rejects.toThrow(
        'Job non-existent is not registered'
      )
    })
  })
})
