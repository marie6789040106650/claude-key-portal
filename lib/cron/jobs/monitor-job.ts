/**
 * MonitorJob - 系统监控定时任务
 *
 * 每分钟执行一次，收集系统性能指标：
 * - 内存使用情况
 * - 健康状态检查
 */

import { CronJob, CronJobResult } from '../cron-runner'
import { MetricsCollectorService } from '@/lib/services/metrics-collector-service'
import { HealthCheckService } from '@/lib/services/health-check-service'

export class MonitorJob implements CronJob {
  name = 'monitor'
  schedule = '* * * * *' // 每分钟
  description = '收集系统性能指标'

  private metricsService = new MetricsCollectorService()
  private healthService = new HealthCheckService()

  handler = async (): Promise<CronJobResult> => {
    return this.execute()
  }

  async execute(): Promise<CronJobResult> {
    const startTime = Date.now()

    try {
      // 记录内存使用
      await this.metricsService.recordMemoryUsage()

      // 执行健康检查
      const healthCheck = await this.healthService.checkAll()

      const duration = Date.now() - startTime

      return {
        success: true,
        duration,
        healthStatus: healthCheck.overall,
        servicesChecked: Object.keys(healthCheck.services).length,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime

      return {
        success: false,
        duration,
        error: error.message,
      }
    }
  }
}
