/**
 * Send Notification UseCase
 * 发送通知用例
 */

import { Result } from '@/lib/domain/shared/result'
import { ValidationError, ExternalServiceError } from '@/lib/domain/shared/errors'
import {
  SendNotificationInput,
  NotificationRecord,
  NotificationChannel,
  NotificationConfig,
} from '@/lib/domain/notification/notification.types'
import { NotificationRepository } from '@/lib/infrastructure/persistence/repositories/notification.repository'
import { sendEmail, generateEmailHtml } from '@/lib/infrastructure/external/email/mailer'
import { sendWebhook } from '@/lib/infrastructure/external/webhook/client'

export class SendNotificationUseCase {
  constructor(private repository: NotificationRepository) {}

  /**
   * 执行发送通知
   */
  async execute(input: SendNotificationInput): Promise<Result<NotificationRecord[]>> {
    const { userId, type, title, message, data, channels } = input

    // 系统级通知处理（无userId）
    if (!userId) {
      return this.sendSystemNotification({ type, title, message, data, channels: channels || [] })
    }

    // 用户通知处理
    return this.sendUserNotification({ userId, type, title, message, data, channels })
  }

  /**
   * 发送用户通知
   */
  private async sendUserNotification(input: {
    userId: string
    type: any
    title: string
    message: string
    data?: any
    channels?: NotificationChannel[]
  }): Promise<Result<NotificationRecord[]>> {
    const { userId, type, title, message, data, channels } = input

    // 1. 获取用户通知配置
    const configResult = await this.repository.getConfig(userId)
    if (!configResult.isSuccess) {
      return Result.fail(configResult.error!)
    }

    const config = configResult.value
    if (!config) {
      return Result.ok([]) // 没有配置，返回空数组
    }

    // 2. 检查是否应该发送此类型的通知
    const shouldSend = this.shouldSendNotification(config, type)
    if (!shouldSend) {
      return Result.ok([])
    }

    // 3. 确定要发送的渠道
    const targetChannels = this.getTargetChannels(config, type, channels)

    // 4. 发送到所有渠道
    const notifications: NotificationRecord[] = []
    const sendPromises: Promise<void>[] = []

    for (const channel of targetChannels) {
      // 创建通知记录
      const createResult = await this.repository.createNotification({
        userId,
        type,
        title,
        message,
        data,
        channel,
        status: 'PENDING',
      })

      if (!createResult.isSuccess) {
        continue // 创建失败跳过此渠道
      }

      const notification = createResult.value
      notifications.push(notification)

      // 收集发送 Promise
      const sendPromise = this.sendToChannel(notification, config, channel)
      sendPromises.push(sendPromise)
    }

    // 5. 等待所有发送完成
    const results = await Promise.allSettled(sendPromises)

    // 6. 检查是否所有渠道都失败
    const allFailed = results.every((result) => result.status === 'rejected')
    if (allFailed && results.length > 0) {
      return Result.fail(new ExternalServiceError('所有通知渠道发送失败'))
    }

    return Result.ok(notifications)
  }

  /**
   * 发送系统级通知（无用户关联）
   */
  private async sendSystemNotification(input: {
    type: any
    title: string
    message: string
    data?: any
    channels: NotificationChannel[]
  }): Promise<Result<NotificationRecord[]>> {
    const { type, title, message, data, channels } = input

    // 系统通知必须指定channels
    if (!channels || channels.length === 0) {
      return Result.fail(new ValidationError('System notifications must specify channels'))
    }

    const notifications: NotificationRecord[] = []
    const sendPromises: Promise<void>[] = []

    for (const channel of channels) {
      // 创建系统级通知记录（userId为null）
      const createResult = await this.repository.createNotification({
        userId: undefined,
        type,
        title,
        message,
        data,
        channel,
        status: 'PENDING',
      })

      if (!createResult.isSuccess) {
        continue
      }

      const notification = createResult.value
      notifications.push(notification)

      // 系统通知使用简化配置
      const sendPromise = this.sendSystemChannel(notification, channel)
      sendPromises.push(sendPromise)
    }

    // 等待所有发送完成
    const results = await Promise.allSettled(sendPromises)

    // 检查是否所有渠道都失败
    const allFailed = results.every((result) => result.status === 'rejected')
    if (allFailed && results.length > 0) {
      return Result.fail(new ExternalServiceError('所有系统通知渠道发送失败'))
    }

    return Result.ok(notifications)
  }

  /**
   * 发送到系统级通知渠道（简化版）
   */
  private async sendSystemChannel(notification: NotificationRecord, channel: string): Promise<void> {
    try {
      if (channel === 'webhook') {
        // 系统webhook使用环境变量配置
        const webhookUrl = process.env.SYSTEM_ALERT_WEBHOOK_URL || 'https://example.com/webhook'
        const webhookSecret = process.env.SYSTEM_ALERT_WEBHOOK_SECRET || ''

        await sendWebhook({
          url: webhookUrl,
          secret: webhookSecret,
          payload: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt.toISOString(),
          },
        })
      } else if (channel === 'system') {
        // 系统内通知，不需要额外操作
        // 管理员可通过dashboard查看
      }

      // 更新为已发送
      const updateResult = await this.repository.updateNotificationStatus(notification.id, 'SENT', undefined)
      if (!updateResult.isSuccess) {
        console.error('Failed to update notification status:', updateResult.error)
      }
    } catch (error: any) {
      // 更新为失败
      const updateResult = await this.repository.updateNotificationStatus(notification.id, 'FAILED', error.message)
      if (!updateResult.isSuccess) {
        console.error('Failed to update notification status:', updateResult.error)
      }
      throw error
    }
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(
    notification: NotificationRecord,
    config: NotificationConfig,
    channel: string
  ): Promise<void> {
    try {
      if (channel === 'email') {
        await this.sendEmailNotification(notification, config)
      } else if (channel === 'webhook') {
        await this.sendWebhookNotification(notification, config)
      } else if (channel === 'system') {
        await this.createSystemNotification(notification)
      }

      // 更新为已发送
      const updateResult = await this.repository.updateNotificationStatus(notification.id, 'SENT', undefined)
      if (!updateResult.isSuccess) {
        console.error('Failed to update notification status:', updateResult.error)
      }
    } catch (error: any) {
      // 更新为失败
      const updateResult = await this.repository.updateNotificationStatus(notification.id, 'FAILED', error.message)
      if (!updateResult.isSuccess) {
        console.error('Failed to update notification status:', updateResult.error)
      }
      // 重新抛出错误，让调用者知道发送失败
      throw error
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(
    notification: NotificationRecord,
    config: NotificationConfig
  ): Promise<void> {
    const emailConfig = config.channels.email

    if (!emailConfig?.enabled || !emailConfig?.address) {
      throw new Error('邮件渠道未启用或未配置邮箱地址')
    }

    const html = generateEmailHtml({
      title: notification.title,
      message: notification.message,
      data: notification.data,
    })

    await sendEmail({
      to: emailConfig.address,
      subject: notification.title,
      html,
    })
  }

  /**
   * 发送 Webhook 通知
   */
  private async sendWebhookNotification(
    notification: NotificationRecord,
    config: NotificationConfig
  ): Promise<void> {
    const webhookConfig = config.channels.webhook

    if (!webhookConfig?.enabled || !webhookConfig?.url) {
      throw new Error('Webhook 渠道未启用或未配置 URL')
    }

    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt.toISOString(),
    }

    await sendWebhook({
      url: webhookConfig.url,
      secret: webhookConfig.secret || '',
      payload,
    })
  }

  /**
   * 创建系统内通知（不需要发送，直接标记为已发送）
   */
  private async createSystemNotification(notification: NotificationRecord): Promise<void> {
    // 系统内通知不需要额外操作
    // 创建记录即可，前端会通过 API 轮询或 WebSocket 获取
    return Promise.resolve()
  }

  /**
   * 获取目标渠道列表
   */
  private getTargetChannels(
    config: NotificationConfig,
    type: any,
    overrideChannels?: NotificationChannel[]
  ): NotificationChannel[] {
    // 如果指定了渠道，直接使用（过滤未启用的）
    if (overrideChannels && overrideChannels.length > 0) {
      return overrideChannels.filter((c) => config.channels[c]?.enabled)
    }

    // 从规则中获取
    const rule = config.rules.find((r: any) => r.type === type)

    if (rule && rule.channels && rule.channels.length > 0) {
      return rule.channels.filter((c: string) => config.channels[c as NotificationChannel]?.enabled)
    }

    // 默认使用所有启用的渠道
    const channels: NotificationChannel[] = []
    if (config.channels.email?.enabled) channels.push('email')
    if (config.channels.webhook?.enabled) channels.push('webhook')
    if (config.channels.system?.enabled) channels.push('system')

    return channels
  }

  /**
   * 检查是否应该发送通知（根据规则）
   */
  private shouldSendNotification(config: NotificationConfig, type: any): boolean {
    if (!config.rules) {
      return true // 没有配置，默认发送
    }

    // 查找对应规则
    const rule = config.rules.find((r: any) => r.type === type)

    if (!rule) {
      return true // 没有规则，默认发送
    }

    return rule.enabled !== false // 规则启用则发送
  }
}

// Export singleton instance
export const sendNotificationUseCase = new SendNotificationUseCase(
  require('@/lib/infrastructure/persistence/repositories/notification.repository').notificationRepository
)
