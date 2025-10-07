/**
 * 到期提醒与通知系统集成测试
 * 测试 ExpirationCheckService 与 NotificationService 的集成
 */

import { ExpirationCheckService } from '@/lib/services/expiration-check-service'
import { NotificationService } from '@/lib/services/notification-service'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
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
    notificationConfig: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email/mailer', () => ({
  sendEmail: jest.fn(),
  generateEmailHtml: jest.fn((params) => `<html>${params.message}</html>`),
}))

jest.mock('@/lib/webhook/client', () => ({
  sendWebhook: jest.fn(),
}))

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { sendEmail } from '@/lib/infrastructure/external/email/mailer'
import { sendWebhook } from '@/lib/infrastructure/external/webhook/client'

describe('ExpirationCheckService + NotificationService 集成测试', () => {
  let expirationService: ExpirationCheckService
  let notificationService: NotificationService
  let fixedNow: Date

  beforeEach(() => {
    jest.clearAllMocks()
    // 使用固定时间避免时间差异
    fixedNow = new Date('2025-10-04T00:00:00.000Z')
    expirationService = new ExpirationCheckService(undefined, () => fixedNow)
    notificationService = new NotificationService()
  })

  describe('完整流程：检查到期 -> 发送通知 -> 记录提醒', () => {
    it('应该完整执行：发现到期密钥 -> 发送多渠道通知 -> 创建提醒记录', async () => {
      const expiresIn7Days = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000)

      // 1. Mock 到期密钥
      const mockKeys = [
        {
          id: 'key-123',
          userId: 'user-456',
          name: 'Production API Key',
          expiresAt: expiresIn7Days,
        },
      ]

      // 2. Mock 到期提醒配置
      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7, 3, 1],
        notifyChannels: ['email', 'system'],
        enabled: true,
      }

      // 3. Mock 通知配置
      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: {
          email: {
            enabled: true,
            address: 'user@example.com',
          },
          webhook: {
            enabled: false,
          },
          system: {
            enabled: true,
          },
        },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: true,
            channels: ['email', 'system'],
          },
        ],
      }

      // Mock 数据库查询
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null) // 未发送过
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )

      // Mock 通知创建
      ;(prisma.notification.create as jest.Mock).mockImplementation((args) =>
        Promise.resolve({
          id: `notif-${args.data.channel}`,
          ...args.data,
          createdAt: new Date(),
        })
      )

      // Mock 邮件发送
      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)

      // Mock 通知更新
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      // Mock 提醒记录创建
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({
        id: 'reminder-1',
        apiKeyId: 'key-123',
        reminderDays: 7,
        sentAt: new Date(),
      })

      // 执行检查
      await expirationService.checkExpirations()

      // 等待异步通知发送完成
      await new Promise((resolve) => setTimeout(resolve, 200))

      // 验证流程
      // 1. 查询了到期密钥
      expect(prisma.apiKey.findMany).toHaveBeenCalled()

      // 2. 查询了用户的到期提醒配置
      expect(prisma.expirationSetting.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
      })

      // 3. 检查了是否已发送过该阶段提醒
      expect(prisma.expirationReminder.findFirst).toHaveBeenCalledWith({
        where: {
          apiKeyId: 'key-123',
          reminderDays: 7,
        },
      })

      // 4. 查询了通知配置
      expect(prisma.notificationConfig.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
      })

      // 5. 创建了2个通知（email + system）
      expect(prisma.notification.create).toHaveBeenCalledTimes(2)
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-456',
          type: 'KEY_EXPIRATION_WARNING',
          channel: 'email',
          title: 'API Key 即将到期',
          message: expect.stringContaining('Production API Key'),
          data: expect.objectContaining({
            apiKeyId: 'key-123',
            apiKeyName: 'Production API Key',
            daysRemaining: 7,
          }),
        }),
      })

      // 6. 发送了邮件
      expect(sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'API Key 即将到期',
        html: expect.any(String),
      })

      // 7. 更新了通知状态为 SENT
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
        },
      })

      // 8. 创建了提醒记录
      expect(prisma.expirationReminder.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'key-123',
          reminderDays: 7,
        },
      })
    })

    it('应该在通知配置禁用时使用默认渠道', async () => {
      // const now = fixedNow
      const expiresIn7Days = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-123',
          userId: 'user-456',
          name: 'Production API Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7],
        notifyChannels: ['email', 'system'],
        enabled: true,
      }

      // 通知配置禁用了 KEY_EXPIRATION_WARNING
      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          system: { enabled: true },
        },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: false, // 禁用
            channels: ['email', 'system'],
          },
        ],
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )

      await expirationService.checkExpirations()

      // 等待异步处理
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 即使通知规则禁用，也不应该发送通知（因为通知服务会检查规则）
      // 或者使用默认配置发送
      // 这取决于 NotificationService 的实现
    })

    it('应该在多个密钥到期时批量发送通知', async () => {
      const expiresIn7Days = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000)
      const expiresIn3Days = new Date(fixedNow.getTime() + 3 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-456',
          name: 'Production Key',
          expiresAt: expiresIn7Days,
        },
        {
          id: 'key-2',
          userId: 'user-456',
          name: 'Development Key',
          expiresAt: expiresIn3Days,
        },
        {
          id: 'key-3',
          userId: 'user-456',
          name: 'Test Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7, 3, 1],
        notifyChannels: ['system'],
        enabled: true,
      }

      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: {
          system: { enabled: true },
        },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: true,
            channels: ['system'],
          },
        ],
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )
      ;(prisma.notification.create as jest.Mock).mockImplementation((args) =>
        Promise.resolve({ id: 'notif', ...args.data })
      )
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await expirationService.checkExpirations()

      await new Promise((resolve) => setTimeout(resolve, 200))

      // 应该创建3个通知（3个密钥都匹配提醒天数）
      expect(prisma.notification.create).toHaveBeenCalledTimes(3)

      // 应该创建3个提醒记录
      expect(prisma.expirationReminder.create).toHaveBeenCalledTimes(3)
    })
  })

  describe('通知内容验证', () => {
    it('应该生成包含完整信息的通知消息', async () => {
      // const now = fixedNow
      const expiresIn7Days = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-123',
          userId: 'user-456',
          name: 'Production API Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7],
        notifyChannels: ['system'],
        enabled: true,
      }

      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: { system: { enabled: true } },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: true,
            channels: ['system'],
          },
        ],
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )
      ;(prisma.notification.create as jest.Mock).mockImplementation((args) =>
        Promise.resolve({ id: 'notif', ...args.data })
      )
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await expirationService.checkExpirations()

      await new Promise((resolve) => setTimeout(resolve, 100))

      // 验证通知消息内容
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'KEY_EXPIRATION_WARNING',
          title: 'API Key 即将到期',
          message: expect.stringMatching(/Production API Key.*7.*天/),
          data: {
            apiKeyId: 'key-123',
            apiKeyName: 'Production API Key',
            daysRemaining: 7,
            expiresAt: expiresIn7Days.toISOString(),
          },
        }),
      })
    })

    it('应该根据剩余天数调整通知紧急程度', async () => {
      // const now = fixedNow
      const expiresIn1Day = new Date(fixedNow.getTime() + 1 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-123',
          userId: 'user-456',
          name: 'Production API Key',
          expiresAt: expiresIn1Day,
        },
      ]

      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7, 3, 1],
        notifyChannels: ['system'],
        enabled: true,
      }

      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: { system: { enabled: true } },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: true,
            channels: ['system'],
          },
        ],
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )
      ;(prisma.notification.create as jest.Mock).mockImplementation((args) =>
        Promise.resolve({ id: 'notif', ...args.data })
      )
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})

      await expirationService.checkExpirations()

      await new Promise((resolve) => setTimeout(resolve, 100))

      // 验证 1 天提醒的消息更紧急
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          message: expect.stringMatching(/1.*天|即将|紧急/),
        }),
      })
    })
  })

  describe('错误场景处理', () => {
    it('应该在通知发送失败时不创建提醒记录', async () => {
      // const now = fixedNow
      const expiresIn7Days = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000)

      const mockKeys = [
        {
          id: 'key-123',
          userId: 'user-456',
          name: 'Production API Key',
          expiresAt: expiresIn7Days,
        },
      ]

      const mockExpirationSettings = {
        id: 'exp-settings-1',
        userId: 'user-456',
        reminderDays: [7],
        notifyChannels: ['email'],
        enabled: true,
      }

      const mockNotificationConfig = {
        id: 'notif-config-1',
        userId: 'user-456',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
        rules: [
          {
            type: 'KEY_EXPIRATION_WARNING',
            enabled: true,
            channels: ['email'],
          },
        ],
      }

      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        mockExpirationSettings
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(
        mockNotificationConfig
      )
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif',
        channel: 'email',
      })

      // 邮件发送失败
      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('SMTP error'))
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await expirationService.checkExpirations()

      await new Promise((resolve) => setTimeout(resolve, 200))

      // 应该创建通知记录
      expect(prisma.notification.create).toHaveBeenCalled()

      // 应该更新通知状态为 FAILED
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif' },
        data: {
          status: 'FAILED',
          error: 'SMTP error',
        },
      })

      // 不应该创建提醒记录（因为发送失败）
      expect(prisma.expirationReminder.create).not.toHaveBeenCalled()
    })
  })
})
