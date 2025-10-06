'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Eye } from 'lucide-react'
import { useIsSmallScreen } from '@/hooks/use-media-query'
import type { KeyStats } from '@/types/stats'

interface StatsTableProps {
  /** 密钥统计数据 */
  keys: KeyStats[]
  /** 查看详情回调 */
  onViewDetails: (keyId: string) => void
  /** 排序回调 */
  onSort?: (field: string, order: 'asc' | 'desc') => void
  /** 当前排序字段 */
  sortField?: string
  /** 当前排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 分页 - 每页数量 */
  pageSize?: number
  /** 分页 - 总数 */
  total?: number
  /** 分页 - 当前页 */
  currentPage?: number
  /** 分页回调 */
  onPageChange?: (page: number) => void
  /** 加载状态 */
  loading?: boolean
  /** 是否高亮前几名 */
  highlightTop?: boolean
  /** 是否显示排名 */
  showRank?: boolean
}

export function StatsTable({
  keys,
  onViewDetails,
  onSort,
  sortField,
  sortOrder,
  pageSize,
  total,
  currentPage = 1,
  onPageChange,
  loading = false,
  highlightTop = false,
  showRank = false,
}: StatsTableProps) {
  // 响应式检测 (必须在所有提前return之前调用)
  const isSmallScreen = useIsSmallScreen()

  // 加载状态
  if (loading) {
    return (
      <div data-testid="table-skeleton" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  // 空状态
  if (keys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
        <svg
          data-testid="empty-state-icon"
          className="w-12 h-12 text-muted-foreground mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-muted-foreground">暂无统计数据</p>
      </div>
    )
  }

  // 排序处理
  const handleSort = (field: string) => {
    if (!onSort) return

    if (sortField === field) {
      // 切换排序顺序
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 新字段，默认升序
      onSort(field, 'asc')
    }
  }

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null

    return sortOrder === 'asc' ? (
      <ArrowUp data-testid="sort-icon-asc" className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDown data-testid="sort-icon-desc" className="w-4 h-4 inline ml-1" />
    )
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // 格式化时间
  const formatTime = (time: string | null) => {
    if (!time) return '从未使用'
    return new Date(time).toLocaleString('zh-CN')
  }

  // 获取状态颜色
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

  // 计算总页数
  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 1

  if (isSmallScreen) {
    // 移动端卡片视图
    return (
      <div data-testid="card-view" className="space-y-4">
        {keys.map((key, index) => (
          <div
            key={key.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                {showRank && (
                  <span className="text-sm text-muted-foreground mr-2">
                    #{index + 1}
                  </span>
                )}
                <h3 className="font-semibold">{key.name}</h3>
              </div>
              <Badge variant={getStatusVariant(key.status) as any}>
                {key.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">请求数:</span>{' '}
                {formatNumber(key.totalRequests)}
              </div>
              <div>
                <span className="text-muted-foreground">Token:</span>{' '}
                {formatNumber(key.totalTokens)}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onViewDetails(key.id)}
              data-testid={`view-details-button-${key.id}`}
            >
              查看详情
            </Button>
          </div>
        ))}
      </div>
    )
  }

  // 桌面端表格视图
  return (
    <div data-testid="table-view">
      <div data-testid="stats-table" className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showRank && <TableHead className="w-[60px]">排名</TableHead>}
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  密钥名称
                  {renderSortIcon('name')}
                </button>
              </TableHead>
              <TableHead>状态</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('totalRequests')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  请求数
                  {renderSortIcon('totalRequests')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('totalTokens')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Token 数
                  {renderSortIcon('totalTokens')}
                </button>
              </TableHead>
              <TableHead>最后使用</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key, index) => (
              <TableRow
                key={key.id}
                className={highlightTop && index === 0 ? 'highlight bg-muted/50' : ''}
              >
                {showRank && (
                  <TableCell className="font-medium">
                    #{index + 1}
                  </TableCell>
                )}
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(key.status) as any}>
                    {key.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatNumber(key.totalRequests)}</TableCell>
                <TableCell>{formatNumber(key.totalTokens)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTime(key.lastUsedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails(key.id)}
                    data-testid={`view-details-button-${key.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pageSize && total && (
        <div data-testid="pagination" className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              data-testid="prev-page-button"
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              data-testid="next-page-button"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
