'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { StatsChart } from '@/components/stats/StatsChart'
import { DateRangePicker } from '@/components/stats/DateRangePicker'
import { ExportDialog } from '@/components/stats/ExportDialog'
import type { DateRangePreset, KeyStats, TimeSeriesDataPoint } from '@/types/stats'

interface KeyStatsDetailPageProps {
  params: {
    id: string
  }
}

export default function KeyStatsDetailPage({ params }: KeyStatsDetailPageProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRangePreset>('last7days')
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()

  // 获取密钥详情
  const {
    data: keyData,
    isLoading: keyLoading,
    error: keyError,
  } = useQuery({
    queryKey: ['key-details', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/keys/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch key details')
      }
      return response.json()
    },
  })

  // 获取使用统计
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch,
  } = useQuery({
    queryKey: ['key-stats', params.id, dateRange, customStartDate, customEndDate],
    queryFn: async () => {
      const response = await fetch(`/api/keys/${params.id}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch key stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleDateRangeChange = (
    preset: DateRangePreset,
    startDate?: Date,
    endDate?: Date
  ) => {
    setDateRange(preset)
    setCustomStartDate(startDate)
    setCustomEndDate(endDate)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'PAUSED':
        return 'secondary'
      case 'EXPIRED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // 加载状态
  if (keyLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div data-testid="key-stats-skeleton" className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-64" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  // 错误状态
  if (keyError || statsError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">加载失败，请稍后重试</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const key = keyData as KeyStats
  const stats = statsData || {
    totalRequests: 0,
    totalTokens: 0,
    averageTokensPerRequest: 0,
    errorRate: 0,
    timeSeries: [],
  }

  // 模拟时间序列数据
  const timeSeriesData: TimeSeriesDataPoint[] = stats.timeSeries || []

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 导航和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{key.name}</h1>
            <p className="text-muted-foreground mt-1">密钥使用详情</p>
          </div>
        </div>
        <ExportDialog
          data={[key]}
          triggerText="导出统计"
          defaultFilename={`${key.name}-stats`}
        />
      </div>

      {/* 密钥信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>密钥信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant={getStatusVariant(key.status) as any} className="mt-1">
                {key.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p className="mt-1 font-medium">
                {new Date(key.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最后使用</p>
              <p className="mt-1 font-medium">
                {key.lastUsedAt
                  ? new Date(key.lastUsedAt).toLocaleString('zh-CN')
                  : '从未使用'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本月使用量</p>
              <p className="mt-1 font-medium text-lg">
                {(key.monthlyUsage || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总请求数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalRequests || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总 Token 数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalTokens || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均 Token/请求
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageTokensPerRequest.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              错误率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.errorRate * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 时间范围选择 */}
      <Card>
        <CardHeader>
          <CardTitle>时间范围</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            value={dateRange}
            startDate={customStartDate}
            endDate={customEndDate}
            onChange={handleDateRangeChange}
          />
        </CardContent>
      </Card>

      {/* 使用趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle>使用趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsChart
            data={timeSeriesData}
            showRequests
            showTokens
            height={300}
          />
        </CardContent>
      </Card>

      {/* 最近请求日志 */}
      <Card>
        <CardHeader>
          <CardTitle>最近请求</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentRequests && stats.recentRequests.length > 0 ? (
            <div className="space-y-2">
              {stats.recentRequests.map((request: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{request.method} {request.path}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={request.status < 400 ? 'default' : 'destructive'}>
                      {request.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.tokens} tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">暂无请求记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
