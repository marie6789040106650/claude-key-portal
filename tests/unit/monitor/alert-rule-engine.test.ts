/**
 * AlertRuleEngine 单元测试
 *
 * 测试告警规则引擎的功能:
 * - 规则配置加载
 * - 阈值评估
 * - 告警触发
 * - 告警去重
 * - 告警恢复
 */

import { AlertRuleEngine } from '@/lib/services/alert-rule-engine'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import {
  AlertCondition,
  AlertSeverity,
  AlertStatus,
  MetricType,
} from '@prisma/client'

// Mock email service
jest.mock('@/lib/email/mailer', () => ({
  sendEmail: jest.fn(),
  generateEmailHtml: jest.fn(),
}))

// Mock webhook client
jest.mock('@/lib/webhook/client', () => ({
  sendWebhook: jest.fn(),
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    alertRule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    alertRecord: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/notification-service')

describe('AlertRuleEngine', () => {
  let engine: AlertRuleEngine
  let mockNotificationService: jest.Mocked<NotificationService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>
    engine = new AlertRuleEngine(mockNotificationService)
  })

  describe('规则加载', () => {
    it('应该加载启用的告警规则', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'High Response Time',
          metric: MetricType.RESPONSE_TIME,
          condition: AlertCondition.GREATER_THAN,
          threshold: 1000,
          duration: 60,
          severity: AlertSeverity.WARNING,
          enabled: true,
          channels: ['email', 'webhook'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.alertRule.findMany as jest.Mock).mockResolvedValue(mockRules)

      const rules = await engine.loadRules()

      expect(rules).toHaveLength(1)
      expect(rules[0].name).toBe('High Response Time')
      expect(prisma.alertRule.findMany).toHaveBeenCalledWith({
        where: { enabled: true },
      })
    })

    it('应该跳过禁用的规则', async () => {
      ;(prisma.alertRule.findMany as jest.Mock).mockResolvedValue([])

      const rules = await engine.loadRules()

      expect(rules).toHaveLength(0)
    })
  })

  describe('阈值评估', () => {
    it('应该在值超过阈值时触发告警', async () => {
      const rule = {
        id: 'rule-1',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
      }

      const shouldAlert = await engine.evaluateRule(rule, 1500)

      expect(shouldAlert).toBe(true)
    })

    it('应该在值低于阈值时不触发告警', async () => {
      const rule = {
        id: 'rule-1',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
      }

      const shouldAlert = await engine.evaluateRule(rule, 500)

      expect(shouldAlert).toBe(false)
    })

    it('应该支持LESS_THAN条件', async () => {
      const rule = {
        id: 'rule-2',
        metric: 'API_SUCCESS_RATE',
        condition: AlertCondition.LESS_THAN as AlertCondition,
        threshold: 95,
        severity: 'ERROR' as AlertSeverity,
      }

      const shouldAlert = await engine.evaluateRule(rule, 90)

      expect(shouldAlert).toBe(true)
    })

    it('应该支持EQUAL_TO条件', async () => {
      const rule = {
        id: 'rule-3',
        metric: 'CUSTOM_METRIC',
        condition: 'EQUAL_TO' as AlertCondition,
        threshold: 0,
        severity: AlertSeverity.CRITICAL as AlertSeverity,
      }

      const shouldAlert = await engine.evaluateRule(rule, 0)

      expect(shouldAlert).toBe(true)
    })
  })

  describe('告警触发', () => {
    it('应该创建新的告警记录', async () => {
      const rule = {
        id: 'rule-1',
        name: 'High Response Time',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
        channels: ['email'],
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: 'rule-1',
        status: AlertStatus.FIRING,
      })

      mockNotificationService.send = jest.fn().mockResolvedValue(undefined)

      await engine.triggerAlert(rule, 1500)

      expect(prisma.alertRecord.create).toHaveBeenCalledWith({
        data: {
          ruleId: 'rule-1',
          status: AlertStatus.FIRING,
          message: expect.stringContaining('High Response Time'),
          value: 1500,
          triggeredAt: expect.any(Date),
        },
      })

      expect(mockNotificationService.send).toHaveBeenCalled()
    })

    it('应该发送告警通知到配置的渠道', async () => {
      const rule = {
        id: 'rule-1',
        name: 'Critical Error',
        metric: 'ERROR_RATE',
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 10,
        severity: AlertSeverity.CRITICAL as AlertSeverity,
        channels: ['email', 'webhook'],
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-1',
      })

      mockNotificationService.send = jest.fn().mockResolvedValue(undefined)

      await engine.triggerAlert(rule, 15)

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ALERT',
          channels: ['email', 'webhook'],
          data: expect.objectContaining({
            severity: AlertSeverity.CRITICAL,
          }),
        })
      )
    })
  })

  describe('告警去重', () => {
    it('应该跳过已存在的未恢复告警', async () => {
      const rule = {
        id: 'rule-1',
        name: 'High Response Time',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
        channels: ['email'],
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: 'rule-1',
        status: AlertStatus.FIRING,
        triggeredAt: new Date(),
      })

      await engine.triggerAlert(rule, 1500)

      // 不应该创建新的告警记录
      expect(prisma.alertRecord.create).not.toHaveBeenCalled()
      // 不应该发送通知
      expect(mockNotificationService.send).not.toHaveBeenCalled()
    })

    it('应该允许已恢复告警再次触发', async () => {
      const rule = {
        id: 'rule-1',
        name: 'High Response Time',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
        channels: ['email'],
      }

      // 返回null表示没有FIRING状态的告警（已恢复的不算）
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)

      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-2',
      })

      mockNotificationService.send = jest.fn().mockResolvedValue(undefined)

      await engine.triggerAlert(rule, 1500)

      // 应该创建新的告警记录
      expect(prisma.alertRecord.create).toHaveBeenCalled()
    })
  })

  describe('告警恢复', () => {
    it('应该在值恢复正常后解决告警', async () => {
      const rule = {
        id: 'rule-1',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: 'rule-1',
        status: AlertStatus.FIRING,
      })

      ;(prisma.alertRecord.update as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        status: AlertStatus.RESOLVED,
      })

      await engine.resolveAlert(rule, 500)

      expect(prisma.alertRecord.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedAt: expect.any(Date),
        },
      })
    })

    it('应该发送恢复通知', async () => {
      const rule = {
        id: 'rule-1',
        name: 'High Response Time',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        channels: ['email'],
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: 'rule-1',
        status: AlertStatus.FIRING,
      })

      ;(prisma.alertRecord.update as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        status: AlertStatus.RESOLVED,
      })

      mockNotificationService.send = jest.fn().mockResolvedValue(undefined)

      await engine.resolveAlert(rule, 500)

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ALERT_RESOLVED',
        })
      )
    })
  })

  describe('边界条件', () => {
    it('应该处理规则加载失败', async () => {
      ;(prisma.alertRule.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      await expect(engine.loadRules()).rejects.toThrow('Database error')
    })

    it('应该处理通知发送失败', async () => {
      const rule = {
        id: 'rule-1',
        name: 'Test Rule',
        metric: MetricType.RESPONSE_TIME,
        condition: AlertCondition.GREATER_THAN as AlertCondition,
        threshold: 1000,
        severity: AlertSeverity.WARNING as AlertSeverity,
        channels: ['email'],
      }

      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-1',
      })

      mockNotificationService.send = jest
        .fn()
        .mockRejectedValue(new Error('Notification failed'))

      // 应该不抛出异常
      await expect(engine.triggerAlert(rule, 1500)).resolves.not.toThrow()
    })
  })
})
