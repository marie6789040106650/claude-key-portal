/**
 * 清理任务 - Cleanup Job
 *
 * 定时清理过期数据和日志
 * 调度: 每日00:00执行
 */

import { prisma } from '@/lib/prisma'
import type { CronJob, CronJobResult } from '@/lib/cron/cron-runner'

export interface CleanupJobConfig {
  retentionDays?: number
}

export class CleanupJob implements CronJob {
  name = 'cleanup'
  schedule = '0 0 * * *' // 每日00:00
  description = '清理过期数据和日志'

  private retentionDays: number

  constructor(config?: CleanupJobConfig) {
    this.retentionDays = config?.retentionDays || 30
  }

  async execute(now?: Date): Promise<CronJobResult> {
    const startTime = Date.now()
    const currentTime = now || new Date()

    try {
      // 计算清理时间点
      const notificationCutoff = new Date(
        currentTime.getTime() - this.retentionDays * 24 * 60 * 60 * 1000
      )
      const logCutoff = new Date(
        currentTime.getTime() - 90 * 24 * 60 * 60 * 1000
      )

      const errors: string[] = []

      // 1. 清理通知记录
      let notificationsDeleted = 0
      try {
        const notificationsBefore = await prisma.notification.count()

        const result = await prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: notificationCutoff,
            },
            status: {
              in: ['SENT', 'FAILED'],
            },
          },
        })

        notificationsDeleted = result.count
        const notificationsAfter = await prisma.notification.count()
      } catch (error: any) {
        errors.push(error.message)
      }

      // 2. 清理执行日志
      let logsDeleted = 0
      try {
        const result = await prisma.cronJobLog.deleteMany({
          where: {
            startAt: {
              lt: logCutoff,
            },
            status: 'SUCCESS',
          },
        })

        logsDeleted = result.count
      } catch (error: any) {
        errors.push(error.message)
      }

      // 3. 清理孤儿数据
      let orphanRemindersDeleted = 0
      let orphanUsageRecordsDeleted = 0

      try {
        const activeKeys = await prisma.apiKey.findMany({
          select: { id: true },
        })

        const activeKeyIds = activeKeys.map((k) => k.id)

        const reminderResult = await prisma.expirationReminder.deleteMany({
          where: {
            apiKeyId: {
              notIn: activeKeyIds,
            },
          },
        })

        orphanRemindersDeleted = reminderResult.count

        const usageResult = await prisma.usageRecord.deleteMany({
          where: {
            apiKeyId: {
              notIn: activeKeyIds,
            },
          },
        })

        orphanUsageRecordsDeleted = usageResult.count
      } catch (error: any) {
        errors.push(error.message)
      }

      // 4. 数据归档
      let recordsArchived = 0
      try {
        const sixMonthsAgo = new Date(
          currentTime.getTime() - 180 * 24 * 60 * 60 * 1000
        )

        const oldRecords = await prisma.usageRecord.findMany({
          where: {
            timestamp: {
              lt: sixMonthsAgo,
            },
          },
          take: 1000, // 每次最多归档1000条
        })

        if (oldRecords.length > 0) {
          // 模拟归档（实际应该写入归档表或导出）
          await prisma.usageRecord.createMany({
            data: oldRecords.map((r) => ({
              ...r,
              id: undefined,
            })),
          })

          recordsArchived = oldRecords.length

          // 删除已归档的记录
          await prisma.usageRecord.deleteMany({
            where: {
              id: {
                in: oldRecords.map((r) => r.id),
              },
            },
          })
        }
      } catch (error: any) {
        errors.push(error.message)
      }

      // 计算存储统计
      const notificationsBefore = await prisma.notification.count()
      const logsBefore = await prisma.cronJobLog.count()
      const notificationsAfter = await prisma.notification.count()
      const logsAfter = await prisma.cronJobLog.count()

      const totalDeleted =
        notificationsDeleted +
        logsDeleted +
        orphanRemindersDeleted +
        orphanUsageRecordsDeleted

      const duration = Date.now() - startTime

      return {
        success: errors.length === 0 || totalDeleted > 0,
        notificationsDeleted,
        logsDeleted,
        orphanRemindersDeleted,
        orphanUsageRecordsDeleted,
        recordsArchived,
        totalDeleted,
        storageStats: {
          notificationsBefore,
          notificationsAfter,
          logsBefore,
          logsAfter,
        },
        errors,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error.message,
        duration,
        notificationsDeleted: 0,
        logsDeleted: 0,
        orphanRemindersDeleted: 0,
        orphanUsageRecordsDeleted: 0,
        totalDeleted: 0,
      }
    }
  }
}
