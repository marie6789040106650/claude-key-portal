/**
 * 通知发送服务单元测试
 * 测试 lib/services/notification-service.ts
 */

import { NotificationService } from '@/lib/services/notification-service'

// Mock 依赖
jest.mock('@/lib/prisma', () => ({
  prisma: {
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
}))

jest.mock('@/lib/webhook/client', () => ({
  sendWebhook: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/mailer'
import { sendWebhook } from '@/lib/webhook/client'

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService()
  })

  describe('send() - 发送通知', () => {
    it('应该根据用户配置发送通知到所有启用的渠道', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: {
            enabled: true,
            address: 'user@example.com',
          },
          webhook: {
            enabled: true,
            url: 'https://example.com/webhook',
            secret: 'secret-key',
          },
          system: {
            enabled: true,
          },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING',
            enabled: true,
            threshold: 80,
            channels: ['email', 'system'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockImplementation((args) =>
        Promise.resolve({
          id: 'notif-123',
          ...args.data,
          createdAt: new Date(),
        })
      )
      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      const input = {
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING',
        title: 'API 速率限制警告',
        message: '您的 API Key 已达到80%速率限制',
        data: { percentage: 80 },
      }

      const result = await service.send(input)

      // 验证创建了通知记录
      expect(prisma.notification.create).toHaveBeenCalledTimes(2) // email + system

      // 验证发送了邮件
      expect(sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'API 速率限制警告',
        html: expect.stringContaining('您的 API Key 已达到80%速率限制'),
      })

      // 验证结果包含所有通知
      expect(result).toHaveLength(2)
    })

    it('应该只发送规则中指定的渠道', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          webhook: { enabled: true, url: 'https://example.com/webhook', secret: 'key' },
          system: { enabled: true },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING',
            enabled: true,
            threshold: 80,
            channels: ['email'], // 仅邮件
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-123' })
      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)

      const input = {
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING',
        title: '警告',
        message: '测试',
      }

      await service.send(input)

      // 应该只创建 email 通知，不包括 webhook 和 system
      expect(prisma.notification.create).toHaveBeenCalledTimes(1)
      expect(sendEmail).toHaveBeenCalledTimes(1)
      expect(sendWebhook).not.toHaveBeenCalled()
    })

    it('应该跳过被禁用的通知类型', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          system: { enabled: true },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING',
            enabled: false, // 禁用
            threshold: 80,
            channels: ['email', 'system'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)

      const input = {
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING',
        title: '警告',
        message: '测试',
      }

      const result = await service.send(input)

      // 不应该发送任何通知
      expect(prisma.notification.create).not.toHaveBeenCalled()
      expect(sendEmail).not.toHaveBeenCalled()
      expect(result).toHaveLength(0)
    })

    it('应该在发送失败时记录错误', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
        rules: [
          {
            type: 'KEY_CREATED',
            enabled: true,
            channels: ['email'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        userId: 'user-123',
        channel: 'email',
      })
      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('SMTP error'))
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      const input = {
        userId: 'user-123',
        type: 'KEY_CREATED',
        title: '密钥创建成功',
        message: '测试',
      }

      await service.send(input)

      // 验证更新了通知状态为 FAILED 并记录错误
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          status: 'FAILED',
          error: 'SMTP error',
        },
      })
    })
  })

  describe('sendEmail() - 发送邮件', () => {
    it('应该发送邮件并更新通知状态', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING',
        title: 'API 速率限制警告',
        message: '您的 API Key 已达到80%速率限制',
        data: null,
        channel: 'email',
        status: 'PENDING',
        sentAt: null,
        readAt: null,
        error: null,
        createdAt: new Date(),
      }

      const userConfig = {
        channels: {
          email: {
            enabled: true,
            address: 'user@example.com',
          },
        },
      }

      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notification,
        status: 'SENT',
        sentAt: new Date(),
      })

      // @ts-ignore - 访问私有方法进行测试
      await service.sendEmailNotification(notification, userConfig)

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: notification.title,
        html: expect.stringContaining(notification.message),
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
        },
      })
    })
  })

  describe('sendWebhook() - 发送 Webhook', () => {
    it('应该发送 Webhook 并更新通知状态', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'user-123',
        type: 'KEY_CREATED',
        title: '新密钥创建',
        message: '密钥已创建',
        data: { apiKeyId: 'key-123' },
        channel: 'webhook',
        status: 'PENDING',
        sentAt: null,
        readAt: null,
        error: null,
        createdAt: new Date(),
      }

      const userConfig = {
        channels: {
          webhook: {
            enabled: true,
            url: 'https://example.com/webhook',
            secret: 'webhook-secret',
          },
        },
      }

      ;(sendWebhook as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        ...notification,
        status: 'SENT',
        sentAt: new Date(),
      })

      // @ts-ignore - 访问私有方法进行测试
      await service.sendWebhookNotification(notification, userConfig)

      expect(sendWebhook).toHaveBeenCalledWith({
        url: 'https://example.com/webhook',
        secret: 'webhook-secret',
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: expect.any(String),
        },
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
        },
      })
    })
  })

  describe('createSystemNotification() - 创建系统通知', () => {
    it('应该创建系统通知记录', async () => {
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        channel: 'system',
        status: 'SENT',
      })

      const input = {
        userId: 'user-123',
        type: 'SYSTEM_ANNOUNCEMENT',
        title: '系统公告',
        message: '系统维护通知',
        data: null,
      }

      // @ts-ignore
      const result = await service.createSystemNotification(input)

      expect(result).toBeDefined()
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          ...input,
          channel: 'system',
          status: 'SENT',
          sentAt: expect.any(Date),
        },
      })
    })
  })

  describe('shouldSendNotification() - 检查是否应该发送', () => {
    it('应该在规则启用时返回 true', async () => {
      const userConfig = {
        rules: [
          {
            type: 'RATE_LIMIT_WARNING',
            enabled: true,
            threshold: 80,
            channels: ['email'],
          },
        ],
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)

      // @ts-ignore
      const result = await service.shouldSendNotification('user-123', 'RATE_LIMIT_WARNING')

      expect(result).toBe(true)
    })

    it('应该在规则禁用时返回 false', async () => {
      const userConfig = {
        rules: [
          {
            type: 'RATE_LIMIT_WARNING',
            enabled: false,
            threshold: 80,
            channels: ['email'],
          },
        ],
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)

      // @ts-ignore
      const result = await service.shouldSendNotification('user-123', 'RATE_LIMIT_WARNING')

      expect(result).toBe(false)
    })

    it('应该在没有匹配规则时返回 true（默认发送）', async () => {
      const userConfig = {
        rules: [],
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)

      // @ts-ignore
      const result = await service.shouldSendNotification('user-123', 'KEY_CREATED')

      expect(result).toBe(true)
    })
  })
})
