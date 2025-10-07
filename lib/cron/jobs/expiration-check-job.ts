/**
 * 到期检查任务 - Expiration Check Job
 *
 * 定时检查即将到期的API Key并发送提醒
 * 调度: 每日09:00执行
 */

import { expirationCheckService } from '@/lib/infrastructure/monitoring'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import type { CronJob, CronJobResult } from '@/lib/cron/cron-runner'

export class ExpirationCheckJob implements CronJob {
  name = 'expiration-check'
  schedule = '0 9 * * *' // 每日09:00
  description = '检查即将到期的API Key并发送提醒'

  handler = async (): Promise<CronJobResult> => {
    return this.execute()
  }

  async execute(): Promise<CronJobResult> {
    const startTime = Date.now()

    try {
      // 获取所有即将到期的Key
      const now = new Date()
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const keys = await prisma.apiKey.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: thirtyDaysLater,
            gt: now,
          },
        },
        include: {
          user: true,
        },
      })

      let remindersSent = 0
      let skipped = 0
      let failed = 0
      const remindersByType: Record<string, number> = {
        '3_DAYS': 0,
        '7_DAYS': 0,
        '30_DAYS': 0,
      }

      // 执行到期检查
      await expirationCheckService.checkExpirations()

      // 统计每个Key的提醒情况
      for (const key of keys) {
        if (!key.expiresAt) continue

        const daysRemaining = Math.ceil(
          (key.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // 判断提醒类型
        let reminderDays = 0
        if (daysRemaining <= 3) {
          reminderDays = 3
          remindersByType['3_DAYS']++
        } else if (daysRemaining <= 7) {
          reminderDays = 7
          remindersByType['7_DAYS']++
        } else if (daysRemaining <= 30) {
          reminderDays = 30
          remindersByType['30_DAYS']++
        }

        // 检查是否已发送过提醒
        const existingReminder = await prisma.expirationReminder.findFirst({
          where: {
            apiKeyId: key.id,
            reminderDays,
          },
        })

        if (existingReminder) {
          skipped++
        } else {
          remindersSent++
        }
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        keysChecked: keys.length,
        remindersSent,
        skipped,
        failed,
        remindersByType,
        checkRanges: {
          '3days': `${now.toISOString()} - ${new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()}`,
          '7days': `${now.toISOString()} - ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}`,
          '30days': `${now.toISOString()} - ${thirtyDaysLater.toISOString()}`,
        },
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error.message,
        duration,
        keysChecked: 0,
        remindersSent: 0,
      }
    }
  }
}
