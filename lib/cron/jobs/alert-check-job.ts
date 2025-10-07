/**
 * AlertCheckJob - 告警检查定时任务
 *
 * 每分钟执行一次，评估告警规则并触发通知
 */

import { CronJob, CronJobResult } from '../cron-runner'
import {
  alertRuleEngine,
  metricsCollectorService,
} from '@/lib/infrastructure/monitoring'

export class AlertCheckJob implements CronJob {
  name = 'alert-check'
  schedule = '* * * * *' // 每分钟
  description = '评估告警规则并触发通知'

  handler = async (): Promise<CronJobResult> => {
    return this.execute()
  }

  async execute(): Promise<CronJobResult> {
    const startTime = Date.now()

    try {
      // 加载所有启用的规则
      const rules = await alertRuleEngine.loadRules()

      let triggered = 0
      let resolved = 0

      // 评估每个规则
      for (const rule of rules) {
        let currentValue: number = 0

        // 根据指标类型获取当前值
        switch (rule.metric) {
          case 'RESPONSE_TIME':
            currentValue = await metricsCollectorService.getAverageResponseTime()
            break
          case 'QPS':
            currentValue = await metricsCollectorService.getQPS()
            break
          case 'MEMORY_USAGE':
            const memoryTrend = await metricsCollectorService.getMemoryTrend()
            currentValue = memoryTrend.current
            break
          default:
            continue
        }

        // 评估规则
        const shouldAlert = await alertRuleEngine.evaluateRule(rule, currentValue)

        if (shouldAlert) {
          await alertRuleEngine.triggerAlert(rule, currentValue)
          triggered++
        } else {
          await alertRuleEngine.resolveAlert(rule, currentValue)
          resolved++
        }
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        duration,
        rulesEvaluated: rules.length,
        alertsTriggered: triggered,
        alertsResolved: resolved,
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
