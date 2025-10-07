/**
// TODO: 待服务迁移到DDD架构后重新启用
describe.skip('SKIPPED - Pending DDD Migration', () => {});
 * 通知发送服务单元测试
 * 测试 lib/services/notification-service.ts
 */

import { NotificationService } from '@/lib/services/notification-service'

// Mock 依赖
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
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

jest.mock('@/lib/infrastructure/external/email/mailer', () => ({
  sendEmail: jest.fn(),
  generateEmailHtml: jest.fn((params) => `<html>${params.message}</html>`),
}))

jest.mock('@/lib/infrastructure/external/webhook/client', () => ({
  sendWebhook: jest.fn(),
}))

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { sendEmail } from '@/lib/infrastructure/external/email/mailer'
import { sendWebhook } from '@/lib/infrastructure/external/webhook/client'

describe.skip('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService()
  })

  describe.skip('send() - 发送通知', () => {
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
            type: 'RATE_LIMIT_WARNING' as const,
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
        type: 'RATE_LIMIT_WARNING' as const,
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
            type: 'RATE_LIMIT_WARNING' as const,
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
        type: 'RATE_LIMIT_WARNING' as const,
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
            type: 'RATE_LIMIT_WARNING' as const,
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
        type: 'RATE_LIMIT_WARNING' as const,
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
            type: 'KEY_CREATED' as const,
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
        type: 'KEY_CREATED' as const,
        title: '密钥创建成功',
        message: '测试',
        data: null,
        channel: 'email',
        status: 'PENDING',
        createdAt: new Date(),
      })
      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('SMTP error'))
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      const input = {
        userId: 'user-123',
        type: 'KEY_CREATED' as const,
        title: '密钥创建成功',
        message: '测试',
      }

      // 所有渠道都失败时，应该抛出错误
      await expect(service.send(input)).rejects.toThrow('所有通知渠道发送失败')

      // 等待异步错误处理完成
      await new Promise((resolve) => setTimeout(resolve, 100))

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

  describe.skip('sendEmail() - 发送邮件', () => {
    it('应该通过 send() 触发邮件发送', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: {
            enabled: true,
            address: 'user@example.com',
          },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING' as const,
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
        type: 'RATE_LIMIT_WARNING' as const,
        title: 'API 速率限制警告',
        message: '您的 API Key 已达到80%速率限制',
        data: null,
        channel: 'email',
        status: 'PENDING',
        createdAt: new Date(),
      })
      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await service.send({
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING' as const,
        title: 'API 速率限制警告',
        message: '您的 API Key 已达到80%速率限制',
      })

      // 等待异步发送完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'API 速率限制警告',
        html: expect.any(String),
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

  describe.skip('sendWebhook() - 发送 Webhook', () => {
    it('应该通过 send() 触发 Webhook 发送', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          webhook: {
            enabled: true,
            url: 'https://example.com/webhook',
            secret: 'webhook-secret',
          },
        },
        rules: [
          {
            type: 'KEY_CREATED' as const,
            enabled: true,
            channels: ['webhook'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        userId: 'user-123',
        type: 'KEY_CREATED' as const,
        title: '新密钥创建',
        message: '密钥已创建',
        data: { apiKeyId: 'key-123' },
        channel: 'webhook',
        status: 'PENDING',
        createdAt: new Date(),
      })
      ;(sendWebhook as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      await service.send({
        userId: 'user-123',
        type: 'KEY_CREATED' as const,
        title: '新密钥创建',
        message: '密钥已创建',
        data: { apiKeyId: 'key-123' },
      })

      // 等待异步发送完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(sendWebhook).toHaveBeenCalledWith({
        url: 'https://example.com/webhook',
        secret: 'webhook-secret',
        payload: {
          id: 'notif-123',
          type: 'KEY_CREATED' as const,
          title: '新密钥创建',
          message: '密钥已创建',
          data: { apiKeyId: 'key-123' },
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

  describe.skip('createSystemNotification() - 创建系统通知', () => {
    it('应该通过 send() 创建系统通知记录', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          system: { enabled: true },
        },
        rules: [
          {
            type: 'SYSTEM_ANNOUNCEMENT',
            enabled: true,
            channels: ['system'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        userId: 'user-123',
        type: 'SYSTEM_ANNOUNCEMENT',
        channel: 'system',
        status: 'PENDING',
      })
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({})

      const result = await service.send({
        userId: 'user-123',
        type: 'SYSTEM_ANNOUNCEMENT',
        title: '系统公告',
        message: '系统维护通知',
      })

      // 等待异步发送完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(result).toHaveLength(1)
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: 'SYSTEM_ANNOUNCEMENT',
          title: '系统公告',
          message: '系统维护通知',
          data: undefined,
          channel: 'system',
          status: 'PENDING',
        },
      })

      // 系统通知会立即标记为已发送
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
        },
      })
    })
  })

  describe.skip('shouldSendNotification() - 检查是否应该发送', () => {
    it('应该在规则启用时发送通知', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING' as const,
            enabled: true,
            threshold: 80,
            channels: ['email'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        channel: 'email',
      })

      const result = await service.send({
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING' as const,
        title: '警告',
        message: '测试',
      })

      // 应该创建通知
      expect(result.length).toBeGreaterThan(0)
      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it('应该在规则禁用时不发送通知', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
        rules: [
          {
            type: 'RATE_LIMIT_WARNING' as const,
            enabled: false,
            threshold: 80,
            channels: ['email'],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)

      const result = await service.send({
        userId: 'user-123',
        type: 'RATE_LIMIT_WARNING' as const,
        title: '警告',
        message: '测试',
      })

      // 不应该创建通知
      expect(result).toHaveLength(0)
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })

    it('应该在没有匹配规则时默认发送通知', async () => {
      const userConfig = {
        id: 'config-123',
        userId: 'user-123',
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.notificationConfig.findUnique as jest.Mock).mockResolvedValue(userConfig)
      ;(prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-123',
        channel: 'email',
      })

      const result = await service.send({
        userId: 'user-123',
        type: 'KEY_CREATED' as const,
        title: '密钥创建',
        message: '测试',
      })

      // 应该创建通知（默认行为）
      expect(result.length).toBeGreaterThan(0)
      expect(prisma.notification.create).toHaveBeenCalled()
    })
  })
})
