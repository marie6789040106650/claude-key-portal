/**
 * 到期检查服务单元测试
 * 测试 lib/services/expiration-check-service.ts
 */

import { ExpirationCheckService } from '@/lib/services/expiration-check-service'

// Mock 依赖
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
    },
    expirationSetting: {
      findUnique: jest.fn(),
    },
    expirationReminder: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/notification-service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}))

import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'

describe('ExpirationCheckService', () => {
  let service: ExpirationCheckService
  let mockNotificationService: any

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ExpirationCheckService()
    mockNotificationService = new NotificationService()
  })

  describe('checkExpirations() - 检查所有到期密钥', () => {
    it('应该检查即将到期的密钥并发送提醒', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const expiresIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      // Mock 密钥数据
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
        {
          id: 'key-2',
          userId: 'user-1',
          name: 'Development Key',
          expiresAt: expiresIn3Days,
        },
        {
          id: 'key-3',
          userId: 'user-2',
          name: 'Test Key',
          expiresAt: expiresIn7Days,
        },
      ]

      // Mock 用户1的提醒配置
      const mockSettings1 = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email', 'system'],
        enabled: true,
      }

      // Mock 用户2的提醒配置
      const mockSettings2 = {
        id: 'settings-2',
        userId: 'user-2',
        reminderDays: [7],
        notifyChannels: ['system'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSettings1) // user-1
        .mockResolvedValueOnce(mockSettings1) // user-1 (key-2)
        .mockResolvedValueOnce(mockSettings2) // user-2

      // Mock 未发送过提醒
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkExpirations()

      // 验证查询了所有有到期时间的密钥
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            not: null,
            gte: expect.any(Date), // 当前时间
          },
        },
        select: {
          id: true,
          userId: true,
          name: true,
          expiresAt: true,
        },
      })

      // 验证发送了通知（3个密钥都匹配提醒天数）
      expect(mockNotificationService.send).toHaveBeenCalledTimes(3)

      // 验证创建了提醒记录
      expect(prisma.expirationReminder.create).toHaveBeenCalledTimes(3)
    })

    it('应该跳过已禁用提醒配置的用户', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: false, // 禁用
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      await service.checkExpirations()

      // 不应该发送通知
      expect(mockNotificationService.send).not.toHaveBeenCalled()
      expect(prisma.expirationReminder.create).not.toHaveBeenCalled()
    })

    it('应该跳过不在提醒天数范围内的密钥', async () => {
      const now = new Date()
      const expiresIn5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn5Days, // 5天后到期
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1], // 没有5天
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      await service.checkExpirations()

      // 不应该发送通知（5不在[7,3,1]中）
      expect(mockNotificationService.send).not.toHaveBeenCalled()
    })

    it('应该跳过已发送过该阶段提醒的密钥', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email'],
        enabled: true,
      }

      const mockExistingReminder = {
        id: 'reminder-1',
        apiKeyId: 'key-1',
        reminderDays: 7,
        sentAt: new Date(),
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        mockExistingReminder
      )

      await service.checkExpirations()

      // 不应该发送通知（已经发送过7天提醒）
      expect(mockNotificationService.send).not.toHaveBeenCalled()
      expect(prisma.expirationReminder.create).not.toHaveBeenCalled()
    })

    it('应该正确计算剩余天数', async () => {
      const now = new Date()
      // 7.5 天后到期（应该向下取整为7天）
      const expiresIn7Point5Days = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Point5Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkExpirations()

      // 应该发送7天提醒（7.5向下取整为7）
      expect(mockNotificationService.send).toHaveBeenCalled()
    })

    it('应该为同一用户的多个到期密钥分别发送提醒', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const expiresIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
        {
          id: 'key-2',
          userId: 'user-1',
          name: 'Development Key',
          expiresAt: expiresIn3Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkExpirations()

      // 应该发送2次通知（每个密钥1次）
      expect(mockNotificationService.send).toHaveBeenCalledTimes(2)

      // 验证通知内容
      expect(mockNotificationService.send).toHaveBeenNthCalledWith(1, {
        userId: 'user-1',
        type: 'KEY_EXPIRATION_WARNING',
        title: 'API Key 即将到期',
        message: expect.stringContaining('Production Key'),
        data: expect.objectContaining({
          apiKeyId: 'key-1',
          apiKeyName: 'Production Key',
          daysRemaining: 7,
        }),
      })

      expect(mockNotificationService.send).toHaveBeenNthCalledWith(2, {
        userId: 'user-1',
        type: 'KEY_EXPIRATION_WARNING',
        title: 'API Key 即将到期',
        message: expect.stringContaining('Development Key'),
        data: expect.objectContaining({
          apiKeyId: 'key-2',
          apiKeyName: 'Development Key',
          daysRemaining: 3,
        }),
      })
    })

    it('应该处理没有到期密钥的情况', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      await service.checkExpirations()

      // 不应该查询配置或发送通知
      expect(prisma.expirationSetting.findUnique).not.toHaveBeenCalled()
      expect(mockNotificationService.send).not.toHaveBeenCalled()
    })

    it('应该处理没有提醒配置的用户（使用默认配置）', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      // 没有配置（返回 null）
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkExpirations()

      // 应该使用默认配置 [7, 3, 1] 并发送通知
      expect(mockNotificationService.send).toHaveBeenCalled()
    })
  })

  describe('checkUserExpirations() - 检查单个用户的到期密钥', () => {
    it('应该检查指定用户的到期密钥', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkUserExpirations('user-1')

      // 验证查询了该用户的密钥
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          expiresAt: {
            not: null,
            gte: expect.any(Date),
          },
        },
        select: expect.any(Object),
      })

      // 验证发送了通知
      expect(mockNotificationService.send).toHaveBeenCalled()
    })

    it('应该只检查指定用户的密钥，不影响其他用户', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // 只返回 user-1 的密钥
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await service.checkUserExpirations('user-1')

      // 验证只查询了 user-1 的配置
      expect(prisma.expirationSetting.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })

      // 验证只发送了1次通知
      expect(mockNotificationService.send).toHaveBeenCalledTimes(1)
    })
  })

  describe('错误处理', () => {
    it('应该处理数据库查询错误', async () => {
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      // 不应该抛出错误（静默失败，记录日志）
      await expect(service.checkExpirations()).resolves.not.toThrow()
    })

    it('应该处理通知发送失败', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockNotificationService.send as jest.Mock).mockRejectedValue(
        new Error('Email send failed')
      )

      // 不应该抛出错误（静默失败）
      await expect(service.checkExpirations()).resolves.not.toThrow()

      // 即使通知失败，也不应该创建提醒记录
      expect(prisma.expirationReminder.create).not.toHaveBeenCalled()
    })

    it('应该继续处理其他密钥，即使某个失败', async () => {
      const now = new Date()
      const expiresIn7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
        {
          id: 'key-2',
          userId: 'user-2',
          name: 'Test Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockSettings1 = {
        id: 'settings-1',
        userId: 'user-1',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }

      const mockSettings2 = {
        id: 'settings-2',
        userId: 'user-2',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSettings1)
        .mockResolvedValueOnce(mockSettings2)
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      // 第一个通知失败，第二个成功
      ;(mockNotificationService.send as jest.Mock)
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce([])

      await service.checkExpirations()

      // 应该尝试发送2次通知
      expect(mockNotificationService.send).toHaveBeenCalledTimes(2)

      // 只有第二个成功，所以只创建1次提醒记录
      expect(prisma.expirationReminder.create).toHaveBeenCalledTimes(1)
    })
  })
})
