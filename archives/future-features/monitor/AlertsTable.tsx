/**
 * AlertsTable - 告警列表表格组件
 *
 * 显示告警记录，支持过滤、排序和分页
 */

'use client'

import { AlertStatus, AlertSeverity, MetricType } from '@prisma/client'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronLeft, ChevronRight, BellOff, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface AlertRecord {
  id: string
  ruleId: string
  status: AlertStatus
  message: string
  value: number
  triggeredAt: Date
  resolvedAt: Date | null
  rule: {
    name: string
    severity: AlertSeverity
    metric: MetricType
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AlertsTableProps {
  alerts: AlertRecord[]
  pagination: Pagination
  isLoading?: boolean
  onFilterChange?: (filters: { status: string | null; severity: string | null }) => void
  onPageChange?: (page: number) => void
  onSortChange?: (sort: { field: string; order: 'asc' | 'desc' }) => void
  onSilence?: (alertId: string) => void
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export function AlertsTable({
  alerts,
  pagination,
  isLoading,
  onFilterChange,
  onPageChange,
  onSortChange,
  onSilence,
  sortField = 'triggeredAt',
  sortOrder = 'desc',
}: AlertsTableProps) {
  // 状态徽章配置
  const statusConfig = {
    FIRING: { label: '活跃', className: 'bg-red-100 text-red-800' },
    RESOLVED: { label: '已解决', className: 'bg-green-100 text-green-800' },
    SILENCED: { label: '已静音', className: 'bg-gray-100 text-gray-800' },
  }

  // 严重程度徽章配置
  const severityConfig = {
    INFO: { className: 'bg-blue-100 text-blue-800' },
    WARNING: { className: 'bg-amber-100 text-amber-800' },
    ERROR: { className: 'bg-orange-100 text-orange-800' },
    CRITICAL: { className: 'bg-red-100 text-red-800' },
  }

  // 处理过滤器变化
  const handleStatusFilterChange = (status: string) => {
    onFilterChange?.({
      status: status === 'all' ? null : status,
      severity: null,
    })
  }

  const handleSeverityFilterChange = (severity: string) => {
    onFilterChange?.({
      status: null,
      severity: severity === 'all' ? null : severity,
    })
  }

  // 处理排序
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
    onSortChange?.({ field, order: newOrder })
  }

  // 加载状态
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>告警记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-[400px]"
            data-testid="table-skeleton"
          >
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 空数据状态
  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>告警记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600">暂无告警记录</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>告警记录</CardTitle>
          <div className="flex items-center space-x-3">
            {/* 状态过滤 */}
            <Select onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[140px]" aria-label="状态过滤">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="FIRING">活跃</SelectItem>
                <SelectItem value="RESOLVED">已解决</SelectItem>
                <SelectItem value="SILENCED">已静音</SelectItem>
              </SelectContent>
            </Select>

            {/* 严重程度过滤 */}
            <Select onValueChange={handleSeverityFilterChange}>
              <SelectTrigger className="w-[140px]" aria-label="严重程度过滤">
                <SelectValue placeholder="严重程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="INFO">信息</SelectItem>
                <SelectItem value="WARNING">警告</SelectItem>
                <SelectItem value="ERROR">错误</SelectItem>
                <SelectItem value="CRITICAL">严重</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border responsive-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>告警ID</TableHead>
                <TableHead>规则名称</TableHead>
                <TableHead>消息</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>严重程度</TableHead>
                <TableHead
                  role="button"
                  className="cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('triggeredAt')}
                >
                  触发时间
                  {sortField === 'triggeredAt' && (
                    <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-mono text-xs">
                    {alert.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{alert.rule.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[alert.status].className}>
                      {statusConfig[alert.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={severityConfig[alert.rule.severity].className}
                      data-testid={`severity-${alert.rule.severity}`}
                    >
                      {alert.rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(alert.triggeredAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </div>
                    {alert.resolvedAt && (
                      <div className="text-xs text-gray-500">
                        已解决于{' '}
                        {formatDistanceToNow(new Date(alert.resolvedAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {alert.status === 'FIRING' && onSilence && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSilence(alert.id)}
                        >
                          <BellOff className="h-4 w-4 mr-1" />
                          静音
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 分页控件 */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            共 {pagination.total} 条记录，当前第 {pagination.page} / {pagination.totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
