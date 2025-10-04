/**
 * 数据同步任务 - Data Sync Job
 *
 * 定时同步外部API的使用统计和额度信息
 * 调度: 每小时执行一次
 */

import { prisma } from '@/lib/prisma'
import type { CronJob, CronJobResult } from '@/lib/cron/cron-runner'

export class DataSyncJob implements CronJob {
  name = 'data-sync'
  schedule = '0 * * * *' // 每小时
  description = '同步外部API使用统计和额度信息'

  handler = async (): Promise<CronJobResult> => {
    return this.execute()
  }

  async execute(): Promise<CronJobResult> {
    const startTime = Date.now()

    try {
      // 获取所有活跃的API Key
      const keys = await prisma.apiKey.findMany({
        where: { status: 'ACTIVE' },
      })

      let keysSynced = 0
      let failed = 0
      let totalUsage = 0
      const errors: string[] = []

      // 并发处理（限制最大并发数为5）
      const batchSize = 5
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)

        const results = await Promise.allSettled(
          batch.map(async (key) => {
            // 模拟获取使用统计
            const response = await fetch(`https://api.example.com/stats/${key.crsKeyId}`)

            if (!response.ok) {
              if (response.status === 429) {
                // 遇到速率限制，重试一次
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const retryResponse = await fetch(`https://api.example.com/stats/${key.crsKeyId}`)
                if (!retryResponse.ok) {
                  throw new Error(`API returned ${retryResponse.status}`)
                }
                return retryResponse.json()
              }
              throw new Error(`API returned ${response.status}`)
            }

            return response.json()
          })
        )

        // 处理结果
        for (let j = 0; j < results.length; j++) {
          const result = results[j]
          const key = batch[j]

          if (result.status === 'fulfilled') {
            const data = result.value
            keysSynced++
            totalUsage += data.usage || 0

            // 更新Key的最后使用时间
            await prisma.apiKey.update({
              where: { id: key.id },
              data: {
                lastUsedAt: new Date(),
              },
            })

            // 创建使用记录
            if (data.usage) {
              await prisma.usageRecord.create({
                data: {
                  apiKeyId: key.id,
                  model: data.model || 'unknown',
                  endpoint: '/api/chat/completions',
                  method: 'POST',
                  promptTokens: data.promptTokens || 0,
                  completionTokens: data.completionTokens || 0,
                  totalTokens: data.usage,
                  duration: data.duration || 0,
                  status: 200,
                  timestamp: new Date(),
                },
              })
            }
          } else {
            failed++
            errors.push(`${key.id}: ${result.reason.message}`)

            // 同步失败不影响现有功能，仅记录错误
          }
        }
      }

      const duration = Date.now() - startTime
      const avgSyncTime = keysSynced > 0 ? Math.round(duration / keysSynced) : 0

      return {
        success: true,
        keysSynced,
        failed,
        totalUsage,
        errors,
        avgSyncTime,
        duration,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime

      return {
        success: false,
        error: error.message,
        duration,
        keysSynced: 0,
        failed: 0,
      }
    }
  }
}
