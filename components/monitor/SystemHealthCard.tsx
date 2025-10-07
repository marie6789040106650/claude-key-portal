/**
 * SystemHealthCard - 系统健康状态卡片组件
 *
 * 显示系统各个服务的健康状态和响应时间
 */

'use client'

import { SystemHealthCheck, ServiceHealth } from '@/lib/services/health-check-service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface SystemHealthCardProps {
  data?: SystemHealthCheck
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

export function SystemHealthCard({
  data,
  isLoading,
  error,
  onRetry,
}: SystemHealthCardProps) {
  // 加载状态
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统健康状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8" data-testid="loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统健康状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                重试
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  // 获取状态颜色和图标
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-amber-600 bg-amber-100'
      case 'unhealthy':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '正常'
      case 'degraded':
        return '降级'
      case 'unhealthy':
        return '异常'
      default:
        return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5" />
      default:
        return null
    }
  }

  const renderServiceStatus = (name: string, service: ServiceHealth) => {
    const isHealthy = service.status === 'healthy'
    const statusColor = isHealthy ? 'text-green-600' : 'text-red-600'

    return (
      <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
        <div className="flex items-center space-x-3">
          <div
            className={statusColor}
            data-testid={`service-status-${service.status}`}
          >
            {isHealthy ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
          <span className="font-medium text-gray-900">{name}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {service.responseTime}ms
          </div>
          {service.error && (
            <div className="text-xs text-red-600 mt-1">{service.error}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="rounded-lg border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>系统健康状态</CardTitle>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(
              data.overall
            )}`}
            data-testid={`status-indicator-${data.overall}`}
            aria-label={`系统状态：${getStatusText(data.overall)}`}
            role="status"
          >
            {getStatusIcon(data.overall)}
            <span className="text-sm font-semibold">
              {getStatusText(data.overall)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 服务状态列表 */}
          <div className="space-y-1">
            {renderServiceStatus('Database', data.services.database)}
            {renderServiceStatus('Redis', data.services.redis)}
            {renderServiceStatus('CRS', data.services.crs)}
          </div>

          {/* 检查时间 */}
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">
              <span>最后检查时间: </span>
              <span data-testid="check-timestamp">
                {formatDistanceToNow(new Date(data.timestamp), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
