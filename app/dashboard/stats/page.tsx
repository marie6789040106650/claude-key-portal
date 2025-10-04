'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { StatsChart } from '@/components/stats/StatsChart'
import { StatsTable } from '@/components/stats/StatsTable'
import { DateRangePicker } from '@/components/stats/DateRangePicker'
import { KeyFilter } from '@/components/stats/KeyFilter'
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

  // 计算查询参数
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()

    // 时间范围
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      params.append('startDate', customStartDate.toISOString().split('T')[0])
      params.append('endDate', customEndDate.toISOString().split('T')[0])
    } else if (dateRange !== 'custom') {
      // 根据预设计算日期
      const end = new Date()
      const start = new Date()

      switch (dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          start.setDate(start.getDate() - 1)
          start.setHours(0, 0, 0, 0)
          end.setDate(end.getDate() - 1)
          end.setHours(23, 59, 59, 999)
          break
        case 'last7days':
          start.setDate(start.getDate() - 7)
          break
        case 'last30days':
          start.setDate(start.getDate() - 30)
          break
        case 'thisMonth':
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          break
        case 'lastMonth':
          start.setMonth(start.getMonth() - 1)
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          end.setMonth(end.getMonth() - 1)
          end.setDate(0) // 上月最后一天
          end.setHours(23, 59, 59, 999)
          break
      }

      params.append('startDate', start.toISOString().split('T')[0])
      params.append('endDate', end.toISOString().split('T')[0])
    }

    return params.toString()
  }, [dateRange, customStartDate, customEndDate])

  // 数据获取
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usage-stats', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/stats/usage?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  })

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
    if (!data?.keys) return []

    // 简化版：将密钥数据按日期聚合
    // 实际应该从后端获取已聚合的时间序列数据
    const keys = selectedKeys.length > 0
      ? (data.keys as KeyStats[]).filter((k) => selectedKeys.includes(k.id))
      : data.keys as KeyStats[]

    // 生成最近7天的数据点（模拟）
    const points: TimeSeriesDataPoint[] = []
    const end = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(end)
      date.setDate(date.getDate() - i)
      points.push({
        timestamp: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 1000), // TODO: 替换为真实数据
        tokens: Math.floor(Math.random() * 20000),
      })
    }

    return points
  }, [data?.keys, selectedKeys])

  // 导出功能
  const handleExport = () => {
    if (!filteredKeys.length) {
      alert('暂无数据可导出')
      return
    }

    // 生成CSV
    const headers = ['密钥名称', '状态', '请求数', 'Token数', '最后使用时间']
    const rows = filteredKeys.map((key) => [
      key.name,
      key.status,
      key.totalRequests.toString(),
      key.totalTokens.toString(),
      key.lastUsedAt || '从未使用',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // 下载
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usage-stats-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

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
        <Button onClick={handleExport} data-testid="export-button">
          <Download className="w-4 h-4 mr-2" />
          导出 CSV
        </Button>
      </div>

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
              {summary.totalRequests.toLocaleString()}
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
              {summary.totalTokens.toLocaleString()}
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
