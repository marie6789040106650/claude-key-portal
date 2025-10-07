/**
 * SendNotificationUseCase Tests
 */

import { SendNotificationUseCase } from '@/lib/application/notification/send-notification.usecase'
import { NotificationRepository } from '@/lib/infrastructure/persistence/repositories/notification.repository'
import { sendEmail, generateEmailHtml } from '@/lib/infrastructure/external/email/mailer'
import { sendWebhook } from '@/lib/infrastructure/external/webhook/client'
import { NotificationType } from '@prisma/client'

// Mock dependencies
jest.mock('@/lib/infrastructure/persistence/repositories/notification.repository')
jest.mock('@/lib/infrastructure/external/email/mailer')
jest.mock('@/lib/infrastructure/external/webhook/client')

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase
  let mockRepository: jest.Mocked<NotificationRepository>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup repository mock
    mockRepository = {
      getConfig: jest.fn(),
      createNotification: jest.fn(),
      updateNotificationStatus: jest.fn(),
    } as any

    useCase = new SendNotificationUseCase(mockRepository)
  })

  describe('用户通知', () => {
    it('应该成功发送用户通知到所有启用的渠道', async () => {
      // Arrange
      const userId = 'user-1'
      const config = {
        userId,
        rules: [
          { type: 'KEY_EXPIRATION_WARNING' as NotificationType, enabled: true, channels: ['email', 'system'] },
        ],
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          system: { enabled: true },
        },
      }

      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: config })
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId,
          type: 'KEY_EXPIRATION_WARNING',
          title: 'Test Notification',
          message: 'Test message',
          channel: 'email',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })

      ;(sendEmail as jest.Mock).mockResolvedValue(undefined)
      ;(generateEmailHtml as jest.Mock).mockReturnValue('<html>Test</html>')

      // Act
      const result = await useCase.execute({
        userId,
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test Notification',
        message: 'Test message',
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(2) // email + system
      expect(mockRepository.createNotification).toHaveBeenCalledTimes(2)
      expect(sendEmail).toHaveBeenCalledTimes(1)
      expect(mockRepository.updateNotificationStatus).toHaveBeenCalledTimes(2)
    })

    it('应该在用户未启用通知类型时返回空数组', async () => {
      // Arrange
      const userId = 'user-1'
      const config = {
        userId,
        rules: [
          { type: 'KEY_EXPIRATION_WARNING' as NotificationType, enabled: false, channels: [] },
        ],
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
      }

      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: config })
      // 不需要mock createNotification，因为不会被调用

      // Act
      const result = await useCase.execute({
        userId,
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test',
        message: 'Test',
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual([])
      expect(mockRepository.createNotification).not.toHaveBeenCalled()
    })

    it('应该在用户无配置时返回空数组', async () => {
      // Arrange
      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: null })
      // 不需要mock createNotification，因为不会被调用

      // Act
      const result = await useCase.execute({
        userId: 'user-1',
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test',
        message: 'Test',
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual([])
    })

    it('应该支持通过channels参数覆盖用户配置', async () => {
      // Arrange
      const userId = 'user-1'
      const config = {
        userId,
        rules: [
          { type: 'KEY_EXPIRATION_WARNING' as NotificationType, enabled: true, channels: ['email', 'system'] },
        ],
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          webhook: { enabled: true, url: 'https://example.com/hook' },
          system: { enabled: true },
        },
      }

      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: config })
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId: 'user-1',
          type: 'KEY_EXPIRATION_WARNING',
          title: 'Test',
          message: 'Test',
          channel: 'webhook',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })
      ;(sendWebhook as jest.Mock).mockResolvedValue(undefined)

      // Act - 只发送到webhook
      const result = await useCase.execute({
        userId,
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test',
        message: 'Test',
        channels: ['webhook'],
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(1) // 只有webhook
      expect(sendWebhook).toHaveBeenCalledTimes(1)
    })

    it('应该在部分渠道发送失败时标记为失败但不影响其他渠道', async () => {
      // Arrange
      const userId = 'user-1'
      const config = {
        userId,
        rules: [
          { type: 'KEY_EXPIRATION_WARNING' as NotificationType, enabled: true, channels: ['email', 'system'] },
        ],
        channels: {
          email: { enabled: true, address: 'user@example.com' },
          system: { enabled: true },
        },
      }

      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: config })
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId,
          type: 'KEY_EXPIRATION_WARNING',
          title: 'Test',
          message: 'Test',
          channel: 'email',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })

      // Email发送失败
      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('Email service down'))
      ;(generateEmailHtml as jest.Mock).mockReturnValue('<html>Test</html>')

      // Act
      const result = await useCase.execute({
        userId,
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test',
        message: 'Test',
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(2) // 仍然创建了2个通知记录
      // 检查email被标记为FAILED
      const failedCalls = (mockRepository.updateNotificationStatus as jest.Mock).mock.calls.filter(
        call => call[1] === 'FAILED'
      )
      expect(failedCalls.length).toBe(1)
      // 检查system被标记为SENT
      const sentCalls = (mockRepository.updateNotificationStatus as jest.Mock).mock.calls.filter(
        call => call[1] === 'SENT'
      )
      expect(sentCalls.length).toBe(1)
    })

    it('应该在所有渠道发送失败时返回错误', async () => {
      // Arrange
      const userId = 'user-1'
      const config = {
        userId,
        rules: [
          { type: 'KEY_EXPIRATION_WARNING' as NotificationType, enabled: true, channels: ['email'] },
        ],
        channels: {
          email: { enabled: true, address: 'user@example.com' },
        },
      }

      mockRepository.getConfig.mockResolvedValue({ isSuccess: true, value: config })
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId,
          type: 'KEY_EXPIRATION_WARNING',
          title: 'Test',
          message: 'Test',
          channel: 'email',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })

      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('Email service down'))
      ;(generateEmailHtml as jest.Mock).mockReturnValue('<html>Test</html>')

      // Act
      const result = await useCase.execute({
        userId,
        type: 'KEY_EXPIRATION_WARNING',
        title: 'Test',
        message: 'Test',
      })

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('所有通知渠道发送失败')
    })
  })

  describe('系统通知', () => {
    it('应该成功发送系统级通知（无userId）', async () => {
      // Arrange
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId: null,
          type: 'ALERT',
          title: 'System Alert',
          message: 'Critical system alert',
          channel: 'webhook',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })
      ;(sendWebhook as jest.Mock).mockResolvedValue(undefined)

      // Act
      const result = await useCase.execute({
        type: 'ALERT' as any,
        title: 'System Alert',
        message: 'Critical system alert',
        channels: ['webhook'],
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(1)
      expect(mockRepository.getConfig).not.toHaveBeenCalled() // 系统通知不查配置
      expect(sendWebhook).toHaveBeenCalledWith({
        url: expect.any(String),
        secret: expect.any(String),
        payload: expect.any(Object),
      })
    })

    it('应该在系统通知未指定channels时返回错误', async () => {
      // Act
      const result = await useCase.execute({
        type: 'ALERT' as any,
        title: 'System Alert',
        message: 'Test',
      })

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('System notifications must specify channels')
    })

    it('应该支持系统通知发送到system渠道', async () => {
      // Arrange
      mockRepository.createNotification.mockResolvedValue({
        isSuccess: true,
        value: {
          id: 'notif-1',
          userId: null,
          type: 'ALERT',
          title: 'System Alert',
          message: 'Test',
          channel: 'system',
          status: 'PENDING',
          createdAt: new Date(),
        } as any,
      })
      mockRepository.updateNotificationStatus.mockResolvedValue({ isSuccess: true, value: {} as any })

      // Act
      const result = await useCase.execute({
        type: 'ALERT' as any,
        title: 'System Alert',
        message: 'Test',
        channels: ['system'],
      })

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toHaveLength(1)
      expect(mockRepository.updateNotificationStatus).toHaveBeenCalledWith(
        expect.any(String),
        'SENT',
        undefined
      )
    })
  })
})
