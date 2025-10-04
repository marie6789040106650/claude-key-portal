'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TimeSeriesDataPoint } from '@/types/stats'

interface StatsChartProps {
  /** 时间序列数据 */
  data?: TimeSeriesDataPoint[]
  /** 是否显示请求数折线 */
  showRequests?: boolean
  /** 是否显示Token数折线 */
  showTokens?: boolean
  /** 图表高度 */
  height?: number
  /** 加载状态 */
  loading?: boolean
}

export function StatsChart({
  data,
  showRequests = true,
  showTokens = true,
  height = 300,
  loading = false,
}: StatsChartProps) {
  // 加载状态
  if (loading) {
    return (
      <div
        data-testid="chart-skeleton"
        className="animate-pulse bg-muted rounded-lg"
        style={{ height: `${height}px` }}
      />
    )
  }

  // 空数据状态
  if (!data || data.length === 0) {
    return (
      <div
        data-testid="stats-chart"
        className="flex items-center justify-center rounded-lg border border-dashed"
        style={{ height: `${height}px` }}
      >
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  // 数据验证
  const isValidData = data.every(
    (point) =>
      point.timestamp &&
      typeof point.requests === 'number' &&
      typeof point.tokens === 'number'
  )

  if (!isValidData) {
    return (
      <div
        data-testid="stats-chart"
        className="flex items-center justify-center rounded-lg border border-destructive"
        style={{ height: `${height}px` }}
      >
        <p className="text-destructive">数据格式错误</p>
      </div>
    )
  }

  return (
    <div data-testid="stats-chart" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              // 格式化日期显示
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('zh-CN')
            }}
          />
          <Legend />
          {showRequests && (
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#8884d8"
              name="请求数"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
          {showTokens && (
            <Line
              type="monotone"
              dataKey="tokens"
              stroke="#82ca9d"
              name="Token 数"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
