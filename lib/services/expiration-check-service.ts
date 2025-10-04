/**
 * 到期检查服务
 * 检查即将到期的 API Key 并发送提醒通知
 */

import { prisma } from '@/lib/prisma'
import { NotificationService } from './notification-service'

export class ExpirationCheckService {
  private notificationService: NotificationService
  private getCurrentTime: () => Date

  constructor(
    notificationService?: NotificationService,
    getCurrentTime?: () => Date
  ) {
    this.notificationService = notificationService || new NotificationService()
    this.getCurrentTime = getCurrentTime || (() => new Date())
  }

  /**
   * 检查所有用户的到期密钥
   */
  async checkExpirations(): Promise<void> {
    try {
      // 1. 查询所有有到期时间的密钥
      const now = this.getCurrentTime()
      const keys = await prisma.apiKey.findMany({
        where: {
          expiresAt: {
            not: null,
            gte: now, // 只查询未过期的
          },
        },
        select: {
          id: true,
          userId: true,
          name: true,
          expiresAt: true,
        },
      })

      // 2. 对每个密钥检查是否需要发送提醒
      for (const key of keys) {
        await this.checkKeyExpiration(key)
      }
    } catch (error) {
      console.error('Expiration check failed:', error)
      // 不抛出错误，避免影响定时任务
    }
  }

  /**
   * 检查指定用户的到期密钥
   */
  async checkUserExpirations(userId: string): Promise<void> {
    try {
      // 1. 查询该用户有到期时间的密钥
      const now = this.getCurrentTime()
      const keys = await prisma.apiKey.findMany({
        where: {
          userId,
          expiresAt: {
            not: null,
            gte: now,
          },
        },
        select: {
          id: true,
          userId: true,
          name: true,
          expiresAt: true,
        },
      })

      // 2. 对每个密钥检查是否需要发送提醒
      for (const key of keys) {
        await this.checkKeyExpiration(key)
      }
    } catch (error) {
      console.error(`User ${userId} expiration check failed:`, error)
      // 不抛出错误
    }
  }

  /**
   * 检查单个密钥的到期状态
   */
  private async checkKeyExpiration(key: {
    id: string
    userId: string
    name: string
    expiresAt: Date | null
  }): Promise<void> {
    if (!key.expiresAt) return

    try {
      // 1. 获取用户的提醒配置
      const settings = await prisma.expirationSetting.findUnique({
        where: { userId: key.userId },
      })

      // 如果没有配置或禁用了提醒，使用默认配置
      const reminderDays = settings?.enabled
        ? settings.reminderDays
        : [7, 3, 1] // 默认配置
      const enabled = settings?.enabled ?? true

      if (!enabled) return

      // 2. 计算剩余天数
      const now = this.getCurrentTime()
      const daysRemaining = Math.floor(
        (key.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // 3. 检查是否在提醒天数列表中
      if (!reminderDays.includes(daysRemaining)) {
        return
      }

      // 4. 检查是否已发送过该阶段的提醒
      const existingReminder = await prisma.expirationReminder.findFirst({
        where: {
          apiKeyId: key.id,
          reminderDays: daysRemaining,
        },
      })

      if (existingReminder) {
        return // 已发送过，跳过
      }

      // 5. 发送通知
      try {
        await this.notificationService.send({
          userId: key.userId,
          type: 'KEY_EXPIRATION_WARNING',
          title: 'API Key 即将到期',
          message: this.buildReminderMessage(key.name, daysRemaining),
          data: {
            apiKeyId: key.id,
            apiKeyName: key.name,
            daysRemaining,
            expiresAt: key.expiresAt.toISOString(),
          },
        })

        // 6. 创建提醒记录
        await prisma.expirationReminder.create({
          data: {
            apiKeyId: key.id,
            reminderDays: daysRemaining,
          },
        })
      } catch (error) {
        console.error(
          `Failed to send expiration reminder for key ${key.id}:`,
          error
        )
        // 不创建提醒记录（下次检查时会重试）
      }
    } catch (error) {
      console.error(`Check expiration for key ${key.id} failed:`, error)
    }
  }

  /**
   * 构建提醒消息
   */
  private buildReminderMessage(keyName: string, daysRemaining: number): string {
    if (daysRemaining === 1) {
      return `您的 API Key "${keyName}" 将在 1 天后到期，请及时续期！`
    }
    return `您的 API Key "${keyName}" 将在 ${daysRemaining} 天后到期，请及时续期。`
  }
}
