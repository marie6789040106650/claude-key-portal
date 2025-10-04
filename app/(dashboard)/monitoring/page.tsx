/**
 * 监控仪表板页面
 *
 * 集成系统健康监控、性能指标可视化和告警管理
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MetricType } from '@prisma/client'
import { SystemHealthCard } from '@/components/monitor/SystemHealthCard'
import { MetricsChart } from '@/components/monitor/MetricsChart'
import { AlertsTable } from '@/components/monitor/AlertsTable'
import { AlertRuleForm } from '@/components/monitor/AlertRuleForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HealthCheckData {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: { status: 'healthy' | 'unhealthy'; responseTime: number; error?: string }
    redis: { status: 'healthy' | 'unhealthy'; responseTime: number; error?: string }
    crs: { status: 'healthy' | 'unhealthy'; responseTime: number; error?: string }
  }
  timestamp: string
}

interface MetricDataPoint {
  timestamp: string
  value: number
  name: string
}

interface Alert {
  id: string
  ruleId: string
  status: 'FIRING' | 'RESOLVED' | 'SILENCED'
  message: string
  value: number
  triggeredAt: Date
  resolvedAt: Date | null
  rule: {
    name: string
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
    metric: MetricType
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MonitoringPage() {
  const queryClient = useQueryClient()
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('RESPONSE_TIME')
  const [alertsPage, setAlertsPage] = useState(1)
  const [alertsFilters, setAlertsFilters] = useState<{
    status: string | null
    severity: string | null
  }>({ status: null, severity: null })
  const [showRuleForm, setShowRuleForm] = useState(false)

  // 获取系统健康状态（每30秒刷新）
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery<HealthCheckData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/monitor/health')
      if (!res.ok) throw new Error('Failed to fetch health data')
      return res.json()
    },
    refetchInterval: 30000, // 30秒刷新
  })

  // 获取性能指标数据（每30秒刷新）
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery<MetricDataPoint[]>({
    queryKey: ['metrics', selectedMetric],
    queryFn: async () => {
      const res = await fetch(`/api/monitor/metrics?type=${selectedMetric}&range=24h`)
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
    refetchInterval: 30000,
  })

  // 获取告警记录（每30秒刷新）
  const {
    data: alertsData,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery<{ alerts: Alert[]; pagination: PaginationData }>({
    queryKey: ['alerts', alertsPage, alertsFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: alertsPage.toString(),
        limit: '10',
      })
      if (alertsFilters.status) params.append('status', alertsFilters.status)
      if (alertsFilters.severity) params.append('severity', alertsFilters.severity)

      const res = await fetch(`/api/monitor/alerts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 30000,
  })

  // 静音告警
  const silenceAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/monitor/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SILENCED' }),
      })
      if (!res.ok) throw new Error('Failed to silence alert')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // 创建告警规则
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/monitor/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create rule')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
      setShowRuleForm(false)
    },
  })

  // 优化：使用 useCallback 缓存回调函数
  const handleMetricChange = useCallback((type: MetricType) => {
    setSelectedMetric(type)
  }, [])

  const handleTimeRangeChange = useCallback((range: string) => {
    console.log('Time range changed:', range)
  }, [])

  const handleHealthRetry = useCallback(() => {
    refetchHealth()
  }, [refetchHealth])

  const handleMetricsRetry = useCallback(() => {
    refetchMetrics()
  }, [refetchMetrics])

  const handleFilterChange = useCallback((filters: { status: string | null; severity: string | null }) => {
    setAlertsFilters(filters)
    setAlertsPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setAlertsPage(page)
  }, [])

  const handleSortChange = useCallback((sort: { field: string; order: 'asc' | 'desc' }) => {
    console.log('Sort changed:', sort)
  }, [])

  const handleSilenceAlert = useCallback((alertId: string) => {
    silenceAlertMutation.mutate(alertId)
  }, [silenceAlertMutation])

  const handleCreateRule = useCallback(async (data: any) => {
    await createRuleMutation.mutateAsync(data)
  }, [createRuleMutation])

  const handleCancelRule = useCallback(() => {
    setShowRuleForm(false)
  }, [])

  // 优化：使用 useMemo 缓存计算值
  const avgResponseTime = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return 0
    return Math.round(
      metricsData.reduce((sum, d) => sum + d.value, 0) / metricsData.length
    )
  }, [metricsData])

  const activeAlertsCount = useMemo(() => {
    return alertsData?.alerts.filter((a) => a.status === 'FIRING').length || 0
  }, [alertsData?.alerts])

  const paginationData = useMemo(() => {
    return alertsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
  }, [alertsData?.pagination])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">监控仪表板</h1>
          <p className="text-gray-600 mt-1">实时监控系统性能和告警状态</p>
        </div>
        <Button onClick={() => setShowRuleForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建告警规则
        </Button>
      </div>

      {/* 系统健康状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SystemHealthCard
            data={healthData}
            isLoading={healthLoading}
            error={healthError?.message}
            onRetry={handleHealthRetry}
          />
        </div>

        {/* 关键指标摘要卡片 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium text-gray-600">平均响应时间</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold">{avgResponseTime}</span>
              <span className="ml-2 text-sm text-gray-500">ms</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium text-gray-600">活跃告警</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-red-600">
                {activeAlertsCount}
              </span>
              <span className="ml-2 text-sm text-gray-500">个</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-medium text-gray-600">系统状态</h3>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  healthData?.overall === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : healthData?.overall === 'degraded'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {healthData?.overall === 'healthy'
                  ? '正常运行'
                  : healthData?.overall === 'degraded'
                    ? '性能降级'
                    : '服务异常'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 性能指标图表 */}
      <MetricsChart
        data={metricsData || []}
        metricType={selectedMetric}
        isLoading={metricsLoading}
        error={metricsError?.message}
        onMetricChange={handleMetricChange}
        onTimeRangeChange={handleTimeRangeChange}
        onRetry={handleMetricsRetry}
        showTimeRangeSelector
      />

      {/* 告警记录表格 */}
      <AlertsTable
        alerts={alertsData?.alerts || []}
        pagination={paginationData}
        isLoading={alertsLoading}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onSilence={handleSilenceAlert}
      />

      {/* 告警规则配置对话框 */}
      <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建告警规则</DialogTitle>
          </DialogHeader>
          <AlertRuleForm
            mode="create"
            onSubmit={handleCreateRule}
            onCancel={handleCancelRule}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
