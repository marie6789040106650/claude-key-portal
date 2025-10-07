/**
 * AlertRuleEngine - 告警规则引擎
 *
 * 负责告警规则的评估和执行:
 * - 规则加载
 * - 阈值评估
 * - 告警触发
 * - 告警去重
 * - 告警恢复
 */

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import {
  AlertCondition,
  AlertRule,
  AlertSeverity,
  MetricType,
} from '@prisma/client'

export interface AlertRuleConfig {
  id: string
  name: string
  metric: MetricType
  condition: AlertCondition
  threshold: number
  severity: AlertSeverity
  channels: string[]
}

export class AlertRuleEngine {
  private notificationService: NotificationService

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService || new NotificationService()
  }

  /**
   * 加载启用的告警规则
   */
  async loadRules(): Promise<AlertRule[]> {
    return await prisma.alertRule.findMany({
      where: { enabled: true },
    })
  }

  /**
   * 评估规则是否触发
   */
  async evaluateRule(
    rule: Pick<AlertRule, 'id' | 'metric' | 'condition' | 'threshold'>,
    value: number
  ): Promise<boolean> {
    switch (rule.condition) {
      case 'GREATER_THAN':
        return value > rule.threshold
      case 'LESS_THAN':
        return value < rule.threshold
      case 'EQUAL_TO':
        return value === rule.threshold
      default:
        return false
    }
  }

  /**
   * 触发告警
   */
  async triggerAlert(
    rule: Pick<
      AlertRule,
      'id' | 'name' | 'metric' | 'condition' | 'threshold' | 'severity' | 'channels'
    >,
    value: number
  ): Promise<void> {
    // 检查是否已存在未恢复的告警（去重）
    const existingAlert = await prisma.alertRecord.findFirst({
      where: {
        ruleId: rule.id,
        status: 'FIRING',
      },
    })

    if (existingAlert) {
      // 已存在未恢复的告警，跳过
      return
    }

    // 创建告警记录
    const alert = await prisma.alertRecord.create({
      data: {
        ruleId: rule.id,
        status: 'FIRING',
        message: `${rule.name}: ${rule.metric} is ${rule.condition.toLowerCase().replace('_', ' ')} ${rule.threshold} (current: ${value})`,
        value,
        triggeredAt: new Date(),
      },
    })

    // 发送告警通知
    try {
      await this.notificationService.send({
        type: 'ALERT' as any,
        title: `[${rule.severity}] ${rule.name}`,
        message: alert.message,
        channels: rule.channels,
        data: {
          alertId: alert.id,
          ruleId: rule.id,
          severity: rule.severity,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
        },
      })
    } catch (error) {
      // 通知发送失败不应该阻止告警记录的创建
      console.error('Failed to send alert notification:', error)
    }
  }

  /**
   * 恢复告警
   */
  async resolveAlert(
    rule: Pick<
      AlertRule,
      'id' | 'name' | 'metric' | 'condition' | 'threshold' | 'channels'
    >,
    value: number
  ): Promise<void> {
    // 查找正在触发的告警
    const firingAlert = await prisma.alertRecord.findFirst({
      where: {
        ruleId: rule.id,
        status: 'FIRING',
      },
    })

    if (!firingAlert) {
      // 没有触发中的告警，无需恢复
      return
    }

    // 更新告警状态为已恢复
    await prisma.alertRecord.update({
      where: { id: firingAlert.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    })

    // 发送恢复通知
    try {
      await this.notificationService.send({
        type: 'ALERT_RESOLVED' as any,
        title: `[RESOLVED] ${rule.name}`,
        message: `${rule.name} has been resolved. ${rule.metric} is now back to normal (current: ${value}, threshold: ${rule.threshold})`,
        channels: rule.channels,
        data: {
          alertId: firingAlert.id,
          ruleId: rule.id,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
        },
      })
    } catch (error) {
      console.error('Failed to send resolution notification:', error)
    }
  }
}
