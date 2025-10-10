import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Stats页面加载骨架屏组件
 *
 * 匹配实际内容布局，提供更好的加载体验：
 * - 标题和操作按钮区域
 * - 4个概览卡片
 * - 2个筛选器卡片
 * - 趋势图卡片
 * - 表格卡片
 */
export function StatsSkeleton() {
  return (
    <div data-testid="stats-skeleton" className="container mx-auto py-8 space-y-6">
      {/* 标题区域骨架 */}
      <div
        data-testid="skeleton-header"
        className="flex items-center justify-between"
      >
        {/* 标题 */}
        <div className="h-10 bg-muted animate-pulse rounded w-32" />

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-muted animate-pulse rounded" />
          <div className="h-10 w-28 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* 概览卡片骨架（4个） */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} data-testid="skeleton-summary-card">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 筛选器骨架（2个并排） */}
      <div data-testid="skeleton-filters" className="grid gap-6 md:grid-cols-2">
        {/* 时间范围筛选器 */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>

        {/* 密钥筛选器 */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>

      {/* 趋势图骨架 */}
      <Card data-testid="skeleton-chart">
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* 表格骨架 */}
      <Card data-testid="skeleton-table">
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 表格行 */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 bg-muted animate-pulse rounded flex-1" />
                <div className="h-12 bg-muted animate-pulse rounded w-24" />
                <div className="h-12 bg-muted animate-pulse rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
