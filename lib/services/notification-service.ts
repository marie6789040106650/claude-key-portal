/**
 * 通知发送服务
 * 负责多渠道通知发送和管理
 */

import { prisma } from '@/lib/prisma'
import { sendEmail, generateEmailHtml } from '@/lib/email/mailer'
import { sendWebhook } from '@/lib/webhook/client'
import { NotificationType } from '@prisma/client'

interface SendNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  channels?: string[] // 不指定则使用用户配置
}

export class NotificationService {
  /**
   * 发送通知到所有启用的渠道
   */
  async send(input: SendNotificationInput): Promise<any[]> {
    const { userId, type, title, message, data, channels } = input

    // 检查是否应该发送此类型的通知
    const shouldSend = await this.shouldSendNotification(userId, type)
    if (!shouldSend) {
      return []
    }

    // 获取用户通知配置
    const config = await prisma.notificationConfig.findUnique({
      where: { userId },
    })

    if (!config) {
      return []
    }

    // 确定要发送的渠道
    const targetChannels = this.getTargetChannels(config, type, channels)

    // 发送到所有渠道
    const notifications = []
    const sendPromises = []

    for (const channel of targetChannels) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
          channel,
          status: 'PENDING',
        },
      })

      // 收集发送 Promise
      const sendPromise = this.sendToChannel(notification, config, channel)
      sendPromises.push(sendPromise)

      notifications.push(notification)
    }

    // 等待所有发送完成
    const results = await Promise.allSettled(sendPromises)

    // 检查是否所有渠道都失败
    const allFailed = results.every(result => result.status === 'rejected')
    if (allFailed && results.length > 0) {
      throw new Error('所有通知渠道发送失败')
    }

    return notifications
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(
    notification: any,
    config: any,
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
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })
    } catch (error: any) {
      // 更新为失败
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      })
      // 重新抛出错误，让调用者知道发送失败
      throw error
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(
    notification: any,
    config: any
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
    notification: any,
    config: any
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
  private async createSystemNotification(notification: any): Promise<void> {
    // 系统内通知不需要额外操作
    // 创建记录即可，前端会通过 API 轮询或 WebSocket 获取
    return Promise.resolve()
  }

  /**
   * 获取目标渠道列表
   */
  private getTargetChannels(
    config: any,
    type: NotificationType,
    overrideChannels?: string[]
  ): string[] {
    // 如果指定了渠道，直接使用
    if (overrideChannels && overrideChannels.length > 0) {
      return overrideChannels.filter((c) => config.channels[c]?.enabled)
    }

    // 从规则中获取
    const rule = config.rules.find((r: any) => r.type === type)

    if (rule && rule.channels && rule.channels.length > 0) {
      return rule.channels.filter((c: string) => config.channels[c]?.enabled)
    }

    // 默认使用所有启用的渠道
    const channels = []
    if (config.channels.email?.enabled) channels.push('email')
    if (config.channels.webhook?.enabled) channels.push('webhook')
    if (config.channels.system?.enabled) channels.push('system')

    return channels
  }

  /**
   * 检查是否应该发送通知（根据规则）
   */
  private async shouldSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    const config = await prisma.notificationConfig.findUnique({
      where: { userId },
    })

    if (!config || !config.rules) {
      return true // 没有配置，默认发送
    }

    // 查找对应规则
    const rules = config.rules as any[]
    const rule = rules.find((r: any) => r.type === type)

    if (!rule) {
      return true // 没有规则，默认发送
    }

    return rule.enabled !== false // 规则启用则发送
  }
}
