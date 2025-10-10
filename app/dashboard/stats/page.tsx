'use client'

import React, { useState, useMemo } from 'react'
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

  // 数据获取 - 使用自定义 hook
  const { data, isLoading, error, refetch } = useUsageStats(
    dateRange,
    customStartDate,
    customEndDate
  )

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
        <ExportDialog data={filteredKeys} />
      </div>

      {/* CRS服务状态提示 */}
      <CrsStatusAlert
        warning={data?.crsWarning}
        onRetry={() => refetch()}
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
