/**
 * AlertRuleEngine 测试
 *
 * 测试场景：
 * - loadRules: 加载启用的告警规则
 * - evaluateRule: 评估规则是否触发
 * - triggerAlert: 触发告警并发送通知
 * - resolveAlert: 恢复告警并发送通知
 * - 告警去重逻辑
 * - 错误处理
 *
 * @jest-environment node
 */

import { AlertRuleEngine } from '@/lib/infrastructure/monitoring/alert-rule-engine'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { SendNotificationUseCase } from '@/lib/application/notification/send-notification.usecase'
import { AlertCondition, AlertSeverity, MetricType, NotificationType } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/infrastructure/persistence/prisma', () => ({
  prisma: {
    alertRule: {
      findMany: jest.fn(),
    },
    alertRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock SendNotificationUseCase
jest.mock('@/lib/application/notification/send-notification.usecase')

describe('AlertRuleEngine', () => {
  let engine: AlertRuleEngine
  let mockSendNotification: jest.Mocked<SendNotificationUseCase>

  beforeEach(() => {
    mockSendNotification = {
      execute: jest.fn(),
    } as any

    engine = new AlertRuleEngine(mockSendNotification)

    jest.clearAllMocks()
  })

  describe('loadRules', () => {
    it('should load enabled rules', async () => {
      // Arrange
      const mockRules = [
        {
          id: 'rule-1',
          name: 'High Error Rate',
          metric: 'ERROR_RATE' as MetricType,
          condition: 'GREATER_THAN' as AlertCondition,
          threshold: 0.05,
          severity: 'HIGH' as AlertSeverity,
          channels: ['email'],
          enabled: true,
        },
        {
          id: 'rule-2',
          name: 'Low Memory',
          metric: 'MEMORY_USAGE' as MetricType,
          condition: 'LESS_THAN' as AlertCondition,
          threshold: 10,
          severity: 'CRITICAL' as AlertSeverity,
          channels: ['webhook'],
          enabled: true,
        },
      ]
      ;(prisma.alertRule.findMany as jest.Mock).mockResolvedValue(mockRules)

      // Act
      const rules = await engine.loadRules()

      // Assert
      expect(rules).toEqual(mockRules)
      expect(prisma.alertRule.findMany).toHaveBeenCalledWith({
        where: { enabled: true },
      })
    })

    it('should return empty array when no rules are enabled', async () => {
      // Arrange
      ;(prisma.alertRule.findMany as jest.Mock).mockResolvedValue([])

      // Act
      const rules = await engine.loadRules()

      // Assert
      expect(rules).toEqual([])
    })
  })

  describe('evaluateRule', () => {
    const rule = {
      id: 'rule-1',
      metric: 'ERROR_RATE' as MetricType,
      condition: 'GREATER_THAN' as AlertCondition,
      threshold: 0.05,
    }

    it('should return true for GREATER_THAN when value > threshold', async () => {
      // Act
      const result = await engine.evaluateRule(rule, 0.1)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for GREATER_THAN when value <= threshold', async () => {
      // Act
      const result1 = await engine.evaluateRule(rule, 0.05)
      const result2 = await engine.evaluateRule(rule, 0.03)

      // Assert
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })

    it('should evaluate LESS_THAN condition correctly', async () => {
      // Arrange
      const lessRule = { ...rule, condition: 'LESS_THAN' as AlertCondition }

      // Act & Assert
      expect(await engine.evaluateRule(lessRule, 0.03)).toBe(true)
      expect(await engine.evaluateRule(lessRule, 0.05)).toBe(false)
      expect(await engine.evaluateRule(lessRule, 0.1)).toBe(false)
    })

    it('should evaluate EQUAL_TO condition correctly', async () => {
      // Arrange
      const equalRule = { ...rule, condition: 'EQUAL_TO' as AlertCondition }

      // Act & Assert
      expect(await engine.evaluateRule(equalRule, 0.05)).toBe(true)
      expect(await engine.evaluateRule(equalRule, 0.03)).toBe(false)
      expect(await engine.evaluateRule(equalRule, 0.1)).toBe(false)
    })
  })

  describe('triggerAlert', () => {
    const rule = {
      id: 'rule-1',
      name: 'High Error Rate',
      metric: 'ERROR_RATE' as MetricType,
      condition: 'GREATER_THAN' as AlertCondition,
      threshold: 0.05,
      severity: 'HIGH' as AlertSeverity,
      channels: ['email', 'webhook'],
    }

    it('should trigger alert and send notification', async () => {
      // Arrange
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: rule.id,
        status: 'FIRING',
        message: expect.any(String),
        value: 0.1,
        triggeredAt: expect.any(Date),
      })
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await engine.triggerAlert(rule, 0.1)

      // Assert
      expect(prisma.alertRecord.create).toHaveBeenCalledWith({
        data: {
          ruleId: rule.id,
          status: 'FIRING',
          message: expect.stringContaining('High Error Rate'),
          value: 0.1,
          triggeredAt: expect.any(Date),
        },
      })
      expect(mockSendNotification.execute).toHaveBeenCalledWith({
        type: NotificationType.ERROR_SPIKE,
        title: '[HIGH] High Error Rate',
        message: expect.any(String),
        channels: ['email', 'webhook'],
        data: {
          alertId: 'alert-1',
          ruleId: rule.id,
          severity: 'HIGH',
          metric: 'ERROR_RATE',
          value: 0.1,
          threshold: 0.05,
        },
      })
    })

    it('should not trigger duplicate alert', async () => {
      // Arrange - existing alert is FIRING
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: rule.id,
        status: 'FIRING',
      })

      // Act
      await engine.triggerAlert(rule, 0.1)

      // Assert
      expect(prisma.alertRecord.create).not.toHaveBeenCalled()
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should not fail when notification sending fails', async () => {
      // Arrange
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.alertRecord.create as jest.Mock).mockResolvedValue({
        id: 'alert-1',
      })
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: false,
        error: new Error('Send failed'),
      } as any)

      // Act & Assert
      await expect(engine.triggerAlert(rule, 0.1)).resolves.not.toThrow()
      expect(prisma.alertRecord.create).toHaveBeenCalled()
    })
  })

  describe('resolveAlert', () => {
    const rule = {
      id: 'rule-1',
      name: 'High Error Rate',
      metric: 'ERROR_RATE' as MetricType,
      condition: 'GREATER_THAN' as AlertCondition,
      threshold: 0.05,
      channels: ['email'],
    }

    it('should resolve alert and send notification', async () => {
      // Arrange
      const firingAlert = {
        id: 'alert-1',
        ruleId: rule.id,
        status: 'FIRING',
      }
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(
        firingAlert
      )
      ;(prisma.alertRecord.update as jest.Mock).mockResolvedValue({
        ...firingAlert,
        status: 'RESOLVED',
        resolvedAt: expect.any(Date),
      })
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: true,
        value: { id: 'notif-1' },
      } as any)

      // Act
      await engine.resolveAlert(rule, 0.03)

      // Assert
      expect(prisma.alertRecord.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
        },
      })
      expect(mockSendNotification.execute).toHaveBeenCalledWith({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: '[RESOLVED] High Error Rate',
        message: expect.stringContaining('resolved'),
        channels: ['email'],
        data: {
          alertId: 'alert-1',
          ruleId: rule.id,
          metric: 'ERROR_RATE',
          value: 0.03,
          threshold: 0.05,
        },
      })
    })

    it('should not resolve when no firing alert exists', async () => {
      // Arrange
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue(null)

      // Act
      await engine.resolveAlert(rule, 0.03)

      // Assert
      expect(prisma.alertRecord.update).not.toHaveBeenCalled()
      expect(mockSendNotification.execute).not.toHaveBeenCalled()
    })

    it('should not fail when resolution notification fails', async () => {
      // Arrange
      ;(prisma.alertRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'alert-1',
        ruleId: rule.id,
        status: 'FIRING',
      })
      ;(prisma.alertRecord.update as jest.Mock).mockResolvedValue({})
      mockSendNotification.execute.mockResolvedValue({
        isSuccess: false,
        error: new Error('Send failed'),
      } as any)

      // Act & Assert
      await expect(engine.resolveAlert(rule, 0.03)).resolves.not.toThrow()
      expect(prisma.alertRecord.update).toHaveBeenCalled()
    })
  })
})
