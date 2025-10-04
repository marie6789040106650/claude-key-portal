/**
 * MetricsChart - 性能指标图表组件
 *
 * 使用Recharts显示性能指标趋势图
 */

'use client'

import { MetricType } from '@prisma/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Loader2, XCircle, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'

interface MetricData {
  timestamp: string
  value: number
  name: string
}

interface MetricsChartProps {
  data: MetricData[]
  metricType: MetricType
  isLoading?: boolean
  error?: string
  onMetricChange?: (type: MetricType) => void
  onTimeRangeChange?: (range: string) => void
  onRetry?: () => void
  showTimeRangeSelector?: boolean
}

const metricConfig = {
  RESPONSE_TIME: {
    title: '响应时间趋势',
    unit: 'ms',
    color: '#3b82f6',
  },
  QPS: {
    title: 'QPS趋势',
    unit: 'req/s',
    color: '#10b981',
  },
  MEMORY_USAGE: {
    title: '内存使用趋势',
    unit: 'MB',
    color: '#f59e0b',
  },
  CPU_USAGE: {
    title: 'CPU使用率趋势',
    unit: '%',
    color: '#ef4444',
  },
  DATABASE_QUERY: {
    title: '数据库查询趋势',
    unit: 'ms',
    color: '#8b5cf6',
  },
  API_SUCCESS_RATE: {
    title: 'API成功率趋势',
    unit: '%',
    color: '#06b6d4',
  },
}

export function MetricsChart({
  data,
  metricType,
  isLoading,
  error,
  onMetricChange,
  onTimeRangeChange,
  onRetry,
  showTimeRangeSelector,
}: MetricsChartProps) {
  const config = metricConfig[metricType] || metricConfig.RESPONSE_TIME

  // 加载状态
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-[300px]"
            data-testid="chart-skeleton"
          >
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
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
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

  // 空数据状态
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3
              className="h-12 w-12 text-gray-400 mx-auto mb-3"
              data-testid="empty-data-icon"
            />
            <p className="text-gray-600">暂无数据</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 格式化时间戳
  const formatXAxis = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm')
  }

  // 格式化Y轴值
  const formatYAxis = (value: number) => {
    return `${value}${config.unit}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{config.title}</CardTitle>
          <div className="flex items-center space-x-3">
            {/* 指标类型选择器 */}
            <Select
              value={metricType}
              onValueChange={(value) => onMetricChange?.(value as MetricType)}
            >
              <SelectTrigger className="w-[180px]" aria-label="选择指标类型">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESPONSE_TIME">响应时间</SelectItem>
                <SelectItem value="QPS">QPS</SelectItem>
                <SelectItem value="MEMORY_USAGE">内存使用</SelectItem>
                <SelectItem value="CPU_USAGE">CPU使用率</SelectItem>
                <SelectItem value="DATABASE_QUERY">数据库查询</SelectItem>
                <SelectItem value="API_SUCCESS_RATE">API成功率</SelectItem>
              </SelectContent>
            </Select>

            {/* 时间范围选择器 */}
            {showTimeRangeSelector && (
              <Select onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-[120px]" aria-label="时间范围">
                  <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1小时</SelectItem>
                  <SelectItem value="6h">6小时</SelectItem>
                  <SelectItem value="24h">24小时</SelectItem>
                  <SelectItem value="7d">7天</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          单位: {config.unit}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}${config.unit}`, '值']}
              labelFormatter={(label) =>
                format(new Date(label), 'yyyy-MM-dd HH:mm:ss')
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
