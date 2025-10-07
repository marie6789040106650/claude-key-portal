/**
 * Notification Repository
 * 通知数据访问层
 */

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { Result } from '@/lib/domain/shared/result'
import { DatabaseError } from '@/lib/domain/shared/errors'
import {
  NotificationRecord,
  NotificationConfig,
  NotificationStatus,
} from '@/lib/domain/notification/notification.types'
import { NotificationType } from '@prisma/client'

export class NotificationRepository {
  /**
   * 获取用户通知配置
   */
  async getConfig(userId: string): Promise<Result<NotificationConfig | null>> {
    try {
      const config = await prisma.notificationConfig.findUnique({
        where: { userId },
      })

      if (!config) {
        return Result.ok(null)
      }

      // 映射Prisma模型到领域模型
      const domainConfig: NotificationConfig = {
        userId: config.userId,
        rules: (config.rules as any[]) || [],
        channels: (config.channels as any) || {},
      }

      return Result.ok(domainConfig)
    } catch (error) {
      return Result.fail(new DatabaseError(`Failed to get notification config: ${(error as Error).message}`))
    }
  }

  /**
   * 创建通知记录
   */
  async createNotification(input: {
    userId?: string
    type: NotificationType
    title: string
    message: string
    data?: any
    channel: string
    status: NotificationStatus
  }): Promise<Result<NotificationRecord>> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId || null,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data,
          channel: input.channel,
          status: input.status,
        },
      })

      // 映射到领域模型
      const record: NotificationRecord = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channel: notification.channel,
        status: notification.status as NotificationStatus,
        sentAt: notification.sentAt || undefined,
        error: notification.error || undefined,
        createdAt: notification.createdAt,
      }

      return Result.ok(record)
    } catch (error) {
      return Result.fail(new DatabaseError(`Failed to create notification: ${(error as Error).message}`))
    }
  }

  /**
   * 更新通知状态
   */
  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    error?: string
  ): Promise<Result<NotificationRecord>> {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: {
          status,
          sentAt: status === 'SENT' ? new Date() : undefined,
          error: error || null,
        },
      })

      const record: NotificationRecord = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channel: notification.channel,
        status: notification.status as NotificationStatus,
        sentAt: notification.sentAt || undefined,
        error: notification.error || undefined,
        createdAt: notification.createdAt,
      }

      return Result.ok(record)
    } catch (error) {
      return Result.fail(new DatabaseError(`Failed to update notification status: ${(error as Error).message}`))
    }
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository()
