'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { StatsChart } from '@/components/stats/StatsChart'
import { StatsTable } from '@/components/stats/StatsTable'
import { DateRangePicker } from '@/components/stats/DateRangePicker'
import { KeyFilter } from '@/components/stats/KeyFilter'
import { ExportDialog } from '@/components/stats/ExportDialog'
import { CrsStatusAlert } from '@/components/stats/CrsStatusAlert'
import { useUsageStats } from '@/hooks/use-stats'
import { useToast } from '@/components/ui/use-toast'
import { formatNumber } from '@/lib/ui-utils'
import type { DateRangePreset, KeyStats, TimeSeriesDataPoint } from '@/types/stats'

export default function UsageStatsPage() {
  // 状态管理
  const [dateRange, setDateRange] = useState<DateRangePreset>('last7days')
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Toast
  const { toast } = useToast()

  // 跟踪CRS警告状态
  const prevCrsWarningRef = useRef<string | undefined>()

  // 数据获取 - 使用自定义 hook
  const { data, isLoading, error, refetch } = useUsageStats(
    dateRange,
    customStartDate,
    customEndDate
  )

  // 监听错误状态，显示Toast
  useEffect(() => {
    if (error) {
      toast({
        title: '加载失败',
        description: '无法获取统计数据，请稍后重试',
        variant: 'destructive',
      })
    }
  }, [error, toast])

  // 数据处理和筛选
  const filteredKeys = useMemo(() => {
    if (!data?.keys) return []

    let keys = data.keys as KeyStats[]

    // 密钥筛选
    if (selectedKeys.length > 0) {
      keys = keys.filter((key) => selectedKeys.includes(key.id))
    }

    // 排序
    if (sortField) {
      keys = [...keys].sort((a, b) => {
        const aVal = a[sortField as keyof KeyStats]
        const bVal = b[sortField as keyof KeyStats]

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }

        return 0
      })
    }

    return keys
  }, [data?.keys, selectedKeys, sortField, sortOrder])

  // 分页数据
  const paginatedKeys = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredKeys.slice(start, start + pageSize)
  }, [filteredKeys, currentPage])

  // 时间序列数据聚合
  const timeSeriesData = useMemo<TimeSeriesDataPoint[]>(() => {
    // 使用真实的CRS趋势数据
    return data?.trend || []
  }, [data?.trend])


  // 时间范围变化
  const handleDateRangeChange = (
    preset: DateRangePreset,
    startDate?: Date,
    endDate?: Date
  ) => {
    setDateRange(preset)
    setCustomStartDate(startDate)
    setCustomEndDate(endDate)
    setCurrentPage(1)
  }

  // 密钥筛选变化
  const handleKeyFilterChange = (keys: string[]) => {
    setSelectedKeys(keys)
    setCurrentPage(1)
  }

  // 排序变化
  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortField(field)
    setSortOrder(order)
  }

  // 查看详情
  const handleViewDetails = (keyId: string) => {
    window.location.href = `/dashboard/keys/${keyId}/stats`
  }

  // 手动刷新处理
  const handleRefresh = async () => {
    try {
      await refetch()
      toast({
        title: '刷新成功',
        description: '统计数据已更新',
      })
    } catch (err) {
      toast({
        title: '刷新失败',
        description: '无法刷新统计数据，请稍后重试',
        variant: 'destructive',
      })
    }
  }

  // CRS重试处理
  const handleCrsRetry = async () => {
    const prevWarning = data?.crsWarning
    try {
      const result = await refetch()

      // 检查CRS状态是否恢复
      const newWarning = result.data?.crsWarning
      if (prevWarning && !newWarning) {
        toast({
          title: 'CRS连接成功',
          description: 'CRS服务已恢复，显示完整数据',
        })
      } else if (newWarning) {
        toast({
          title: 'CRS重试失败',
          description: 'CRS服务仍然不可用，已显示本地数据',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'CRS重试失败',
        description: 'CRS服务仍然不可用，已显示本地数据',
        variant: 'destructive',
      })
    }
  }

  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">加载失败，请稍后重试</p>
            <Button
              onClick={() => refetch()}
              data-testid="retry-button"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 骨架屏
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div data-testid="stats-skeleton" className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-48" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  const summary = data?.summary || {
    totalTokens: 0,
    totalRequests: 0,
    averageTokensPerRequest: 0,
    keyCount: 0,
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">使用统计</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '刷新中...' : '刷新'}
          </Button>
          <ExportDialog data={filteredKeys} />
        </div>
      </div>

      {/* CRS服务状态提示 */}
      <CrsStatusAlert
        warning={data?.crsWarning}
        onRetry={handleCrsRetry}
        retrying={isLoading}
      />

      {/* 概览卡片 */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总请求数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.totalRequests)}
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
              {formatNumber(summary.totalTokens)}
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
              {summary.averageTokensPerRequest.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              密钥数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.keyCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <div className="grid gap-6 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>密钥筛选</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyFilter
              keys={data?.keys || []}
              selectedKeys={selectedKeys}
              onChange={handleKeyFilterChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* 时间趋势图 */}
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

      {/* 密钥统计表格 */}
      <Card>
        <CardHeader>
          <CardTitle>密钥统计</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsTable
            keys={paginatedKeys}
            onViewDetails={handleViewDetails}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
            pageSize={pageSize}
            total={filteredKeys.length}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
