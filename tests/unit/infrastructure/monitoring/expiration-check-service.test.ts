/**
 * ExpirationCheckService 测试
 *
 * 测试场景：
 * - checkExpirations: 检查所有用户的到期密钥
 * - checkUserExpirations: 检查特定用户的到期密钥
 * - 提醒天数计算和通知发送
 * - 去重逻辑（避免重复发送）
 * - 错误处理
 */

import { ExpirationCheckService } from '@/lib/infrastructure/monitoring/expiration-check-service'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { SendNotificationUseCase } from '@/lib/application/notification/send-notification.usecase'

// Mock Prisma
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
  },
}))

// Mock SendNotificationUseCase
jest.mock('@/lib/application/notification/send-notification.usecase')

describe('ExpirationCheckService', () => {
  let service: ExpirationCheckService
  let mockSendNotification: jest.Mocked<SendNotificationUseCase>
  let mockGetCurrentTime: jest.Mock

  beforeEach(() => {
    mockSendNotification = {
      execute: jest.fn(),
    } as any

    mockGetCurrentTime = jest.fn(() => new Date('2025-01-01T00:00:00Z'))

    service = new ExpirationCheckService(
      mockSendNotification,
      mockGetCurrentTime
    )

    jest.clearAllMocks()
  })

  describe('checkExpirations', () => {
    it('should check all keys with expiration dates', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key 1',
          expiresAt: new Date('2025-01-08T00:00:00Z'), // 7 days
        },
        {
          id: 'key-2',
          userId: 'user-2',
          name: 'Test Key 2',
          expiresAt: new Date('2025-01-04T00:00:00Z'), // 3 days
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await service.checkExpirations()

      // Assert
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            not: null,
            gte: new Date('2025-01-01T00:00:00Z'),
          },
        },
        select: {
          id: true,
          userId: true,
          name: true,
          expiresAt: true,
        },
      })
      expect(mockSendNotification.execute).toHaveBeenCalledTimes(2)
    })

    it('should not fail when no keys are expiring', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      // Act & Assert
      await expect(service.checkExpirations()).resolves.not.toThrow()
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should not throw when database query fails', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockRejectedValue(
        new Error('DB error')
      )

      // Act & Assert
      await expect(service.checkExpirations()).resolves.not.toThrow()
    })
  })

  describe('checkUserExpirations', () => {
    it('should check keys for specific user', async () => {
      // Arrange
      const userId = 'user-1'
      const mockKeys = [
        {
          id: 'key-1',
          userId,
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await service.checkUserExpirations(userId)

      // Assert
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          expiresAt: {
            not: null,
            gte: new Date('2025-01-01T00:00:00Z'),
          },
        },
        select: {
          id: true,
          userId: true,
          name: true,
          expiresAt: true,
        },
      })
      expect(mockSendNotification.execute).toHaveBeenCalledTimes(1)
    })

    it('should not throw when user has no expiring keys', async () => {
      // Arrange
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue([])

      // Act & Assert
      await expect(
        service.checkUserExpirations('user-1')
      ).resolves.not.toThrow()
    })
  })

  describe('reminder logic', () => {
    it('should send reminder at 7 days before expiration', async () => {
      // Arrange - 7 days before expiration
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        reminderDays: [7, 3, 1],
      })
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await service.checkExpirations()

      // Assert
      expect(mockSendNotification.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'KEY_EXPIRATION_WARNING',
        title: 'API Key 即将到期',
        message: expect.stringContaining('7 天后到期'),
        channels: ['system'],
        data: {
          apiKeyId: 'key-1',
          apiKeyName: 'Test Key',
          daysRemaining: 7,
          expiresAt: '2025-01-08T00:00:00.000Z',
        },
      })
    })

    it('should send reminder at 1 day before expiration', async () => {
      // Arrange - 1 day before expiration
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-02T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await service.checkExpirations()

      // Assert
      expect(mockSendNotification.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('1 天后到期'),
        })
      )
    })

    it('should not send reminder if not in reminder days', async () => {
      // Arrange - 5 days (not in default [7, 3, 1])
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-06T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )

      // Act
      await service.checkExpirations()

      // Assert
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should not send duplicate reminder', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue({
        id: 'reminder-1',
        apiKeyId: 'key-1',
        reminderDays: 7,
      })

      // Act
      await service.checkExpirations()

      // Assert
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should not send reminder if user disabled it', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue({
        enabled: false,
        reminderDays: [7, 3, 1],
      })

      // Act
      await service.checkExpirations()

      // Assert
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should create reminder record after sending notification', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.create as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await service.checkExpirations()

      // Assert
      expect(prisma.expirationReminder.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'key-1',
          reminderDays: 7,
        },
      })
    })

    it('should not create reminder record if notification fails', async () => {
      // Arrange
      const mockKeys = [
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          expiresAt: new Date('2025-01-08T00:00:00Z'),
        },
      ]
      ;(prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys)
      ;(prisma.expirationSetting.findUnique as jest.Mock).mockResolvedValue(
        null
      )
      ;(prisma.expirationReminder.findFirst as jest.Mock).mockResolvedValue(
        null
      )
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: false,
        error: new Error('Send failed'),
      } as any)

      // Act
      await service.checkExpirations()

      // Assert
      expect(prisma.expirationReminder.create).not.toHaveBeenCalled()
    })
  })
})
