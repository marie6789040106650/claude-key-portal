/**
 * 监控 API 单元测试
 *
 * 测试监控相关的API端点:
 * - GET /api/monitor/health - 健康检查
 * - GET /api/monitor/metrics - 指标查询
 * - GET /api/monitor/alerts - 告警记录
 * - PUT /api/monitor/config - 配置管理
 */

import { GET as healthGet } from '@/app/api/monitor/health/route'
import { GET as metricsGet } from '@/app/api/monitor/metrics/route'
import { GET as alertsGet } from '@/app/api/monitor/alerts/route'
import { PUT as configPut } from '@/app/api/monitor/config/route'
import { HealthCheckService } from '@/lib/services/health-check-service'
import { MetricsCollectorService } from '@/lib/services/metrics-collector-service'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock services
jest.mock('@/lib/services/health-check-service')
jest.mock('@/lib/services/metrics-collector-service')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    alertRecord: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    alertRule: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

describe('Monitor API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/monitor/health', () => {
    it('应该返回系统健康状态', async () => {
      const mockHealthCheck = {
        overall: 'healthy',
        services: {
          database: { status: 'healthy', responseTime: 10 },
          redis: { status: 'healthy', responseTime: 5 },
          crs: { status: 'healthy', responseTime: 150 },
        },
        timestamp: new Date().toISOString(),
      }

      ;(HealthCheckService as jest.Mock).mockImplementation(() => ({
        checkAll: jest.fn().mockResolvedValue(mockHealthCheck),
      }))

      const response = await healthGet()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overall).toBe('healthy')
      expect(data.services).toHaveProperty('database')
      expect(data.services).toHaveProperty('redis')
      expect(data.services).toHaveProperty('crs')
    })

    it('应该返回降级状态当某些服务不可用', async () => {
      const mockHealthCheck = {
        overall: 'degraded',
        services: {
          database: { status: 'healthy', responseTime: 10 },
          redis: { status: 'unhealthy', error: 'Connection timeout' },
          crs: { status: 'healthy', responseTime: 150 },
        },
      }

      ;(HealthCheckService as jest.Mock).mockImplementation(() => ({
        checkAll: jest.fn().mockResolvedValue(mockHealthCheck),
      }))

      const response = await healthGet()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overall).toBe('degraded')
    })
  })

  describe('GET /api/monitor/metrics', () => {
    it('应该返回性能指标', async () => {
      const mockMetrics = {
        averageResponseTime: 125,
        p95ResponseTime: 250,
        qps: 15.5,
        memoryUsage: {
          current: 150_000_000,
          trend: 'stable',
        },
      }

      ;(MetricsCollectorService as jest.Mock).mockImplementation(() => ({
        getAverageResponseTime: jest.fn().mockResolvedValue(125),
        getP95ResponseTime: jest.fn().mockResolvedValue(250),
        getQPS: jest.fn().mockResolvedValue(15.5),
        getMemoryTrend: jest.fn().mockResolvedValue({
          current: 150_000_000,
          trend: 'stable',
        }),
      }))

      const request = new NextRequest('http://localhost:3000/api/monitor/metrics')
      const response = await metricsGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.averageResponseTime).toBe(125)
      expect(data.qps).toBe(15.5)
    })

    it('应该支持时间范围过滤', async () => {
      ;(MetricsCollectorService as jest.Mock).mockImplementation(() => ({
        getMetricsByTimeRange: jest.fn().mockResolvedValue([]),
      }))

      const request = new NextRequest(
        'http://localhost:3000/api/monitor/metrics?from=2025-10-04T00:00:00Z&to=2025-10-04T23:59:59Z'
      )
      const response = await metricsGet(request)

      expect(response.status).toBe(200)
    })

    it('应该支持按指标类型过滤', async () => {
      ;(MetricsCollectorService as jest.Mock).mockImplementation(() => ({
        getMetricsByType: jest.fn().mockResolvedValue([]),
      }))

      const request = new NextRequest(
        'http://localhost:3000/api/monitor/metrics?type=RESPONSE_TIME'
      )
      const response = await metricsGet(request)

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/monitor/alerts', () => {
    it('应该返回告警记录列表', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          ruleId: 'rule-1',
          status: 'FIRING',
          message: 'High response time detected',
          value: 1500,
          triggeredAt: new Date(),
          rule: {
            name: 'High Response Time',
            severity: 'WARNING',
          },
        },
        {
          id: 'alert-2',
          ruleId: 'rule-2',
          status: 'RESOLVED',
          message: 'Low success rate',
          value: 85,
          triggeredAt: new Date(),
          resolvedAt: new Date(),
          rule: {
            name: 'Low Success Rate',
            severity: 'ERROR',
          },
        },
      ]

      ;(prisma.alertRecord.findMany as jest.Mock).mockResolvedValue(mockAlerts)
      ;(prisma.alertRecord.count as jest.Mock).mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/monitor/alerts')
      const response = await alertsGet(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.alerts).toHaveLength(2)
      expect(data.total).toBe(2)
    })

    it('应该支持按状态过滤', async () => {
      ;(prisma.alertRecord.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.alertRecord.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest(
        'http://localhost:3000/api/monitor/alerts?status=FIRING'
      )
      const response = await alertsGet(request)

      expect(prisma.alertRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'FIRING' },
        })
      )
    })

    it('应该支持按严重程度过滤', async () => {
      ;(prisma.alertRecord.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.alertRecord.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest(
        'http://localhost:3000/api/monitor/alerts?severity=CRITICAL'
      )
      const response = await alertsGet(request)

      expect(prisma.alertRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            rule: {
              severity: 'CRITICAL',
            },
          },
        })
      )
    })

    it('应该支持分页', async () => {
      ;(prisma.alertRecord.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.alertRecord.count as jest.Mock).mockResolvedValue(100)

      const request = new NextRequest(
        'http://localhost:3000/api/monitor/alerts?page=2&limit=20'
      )
      const response = await alertsGet(request)
      const data = await response.json()

      expect(prisma.alertRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      )
      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      })
    })
  })

  describe('PUT /api/monitor/config', () => {
    it('应该更新告警规则配置', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'High Response Time',
        threshold: 1500, // 更新后
        enabled: true,
      }

      ;(prisma.alertRule.findUnique as jest.Mock).mockResolvedValue({
        id: 'rule-1',
        threshold: 1000,
      })

      ;(prisma.alertRule.update as jest.Mock).mockResolvedValue(mockRule)

      const request = new NextRequest('http://localhost:3000/api/monitor/config', {
        method: 'PUT',
        body: JSON.stringify({
          ruleId: 'rule-1',
          threshold: 1500,
        }),
      })

      const response = await configPut(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.threshold).toBe(1500)
      expect(prisma.alertRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { threshold: 1500 },
      })
    })

    it('应该返回404当规则不存在', async () => {
      ;(prisma.alertRule.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/monitor/config', {
        method: 'PUT',
        body: JSON.stringify({
          ruleId: 'non-existent',
          threshold: 1500,
        }),
      })

      const response = await configPut(request)

      expect(response.status).toBe(404)
    })

    it('应该验证配置参数', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitor/config', {
        method: 'PUT',
        body: JSON.stringify({
          ruleId: 'rule-1',
          threshold: -100, // 无效值
        }),
      })

      const response = await configPut(request)

      expect(response.status).toBe(400)
    })
  })
})
