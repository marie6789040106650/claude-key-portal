'use client'

import React, { useState, useMemo, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUp, ArrowDown, Edit, Trash2, Copy, Plus, Power, FileText } from 'lucide-react'
import { getStatusBadgeVariant } from '@/lib/utils/keys'
import type { ApiKey } from '@/types/keys'

interface KeysTableProps {
  keys: ApiKey[]
  onEdit: (key: ApiKey) => void
  onEditDescription?: (key: ApiKey) => void
  onDelete: (key: ApiKey) => void
  onCopy: (keyId: string) => void
  onToggleStatus?: (key: ApiKey) => void
  onCreateKey?: () => void
  onRetry?: () => void
  filterable?: boolean
  searchable?: boolean
  selectable?: boolean
  pageSize?: number
  loading?: boolean
  error?: Error | null
}

type SortField = 'name' | 'createdAt' | null
type SortOrder = 'asc' | 'desc'

function KeysTableComponent({
  keys,
  onEdit,
  onEditDescription,
  onDelete,
  onCopy,
  onToggleStatus,
  onCreateKey,
  onRetry,
  filterable = false,
  searchable = false,
  selectable = false,
  pageSize = 10,
  loading = false,
  error = null,
}: KeysTableProps) {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [showCopyToast, setShowCopyToast] = useState(false)

  // 排序逻辑
  const handleSort = useCallback((field: 'name' | 'createdAt') => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')
        return field
      } else {
        setSortOrder('asc')
        return field
      }
    })
  }, [])

  // 过滤和排序后的数据
  const filteredAndSortedKeys = useMemo(() => {
    let result = [...keys]

    // 状态过滤
    if (filterable && statusFilter !== 'ALL') {
      result = result.filter((key) => key.status === statusFilter)
    }

    // 搜索过滤
    if (searchable && searchQuery) {
      result = result.filter((key) =>
        key.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 排序
    if (sortField) {
      result.sort((a, b) => {
        let comparison = 0
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name)
        } else if (sortField === 'createdAt') {
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // 默认降序
        }
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [keys, statusFilter, searchQuery, sortField, sortOrder, filterable, searchable])

  // 分页
  const totalPages = Math.ceil(filteredAndSortedKeys.length / pageSize)
  const paginatedKeys = filteredAndSortedKeys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // 复制处理
  const handleCopy = useCallback((keyId: string) => {
    onCopy(keyId)
    setShowCopyToast(true)
    setTimeout(() => setShowCopyToast(false), 2000)
  }, [onCopy])

  // 清除过滤
  const handleClearFilters = useCallback(() => {
    setStatusFilter('ALL')
    setSearchQuery('')
  }, [])

  // 选中处理
  const handleToggleSelect = useCallback((keyId: string) => {
    setSelectedKeys((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(keyId)) {
        newSelected.delete(keyId)
      } else {
        newSelected.add(keyId)
      }
      return newSelected
    })
  }, [])

  return (
    <div data-testid="keys-table" className="space-y-4">
      {/* 过滤和搜索栏 - 始终显示 */}
      {(filterable || searchable) && (
        <div className="flex gap-4 items-center">
          {searchable && (
            <Input
              data-testid="search-input"
              placeholder="搜索密钥名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="max-w-sm"
            />
          )}
          {filterable && (
            <>
              <select
                data-testid="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading}
                className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">全部状态</option>
                <option value="ACTIVE">激活</option>
                <option value="INACTIVE">未激活</option>
                <option value="EXPIRED">已过期</option>
              </select>
              <Button
                data-testid="clear-filters"
                variant="outline"
                onClick={handleClearFilters}
                disabled={loading}
              >
                清除过滤
              </Button>
              <span data-testid="filter-result-count" className="text-sm text-muted-foreground">
                显示 {filteredAndSortedKeys.length} / {keys.length} 个密钥
              </span>
            </>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div data-testid="loading-skeleton" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {!loading && error && (
        <div data-testid="error-state" className="text-center py-8">
          <p className="text-destructive mb-4">{error.message}</p>
          {onRetry && (
            <Button data-testid="retry-button" onClick={onRetry} variant="outline">
              重试
            </Button>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && keys.length === 0 && (
        <div data-testid="empty-state" className="text-center py-8">
          <p className="text-muted-foreground mb-4">暂无密钥</p>
          {onCreateKey && (
            <Button data-testid="create-key-button" onClick={onCreateKey}>
              <Plus className="mr-2 h-4 w-4" />
              创建密钥
            </Button>
          )}
        </div>
      )}

      {/* 复制提示 */}
      {showCopyToast && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg">
          已复制到剪贴板
        </div>
      )}

      {/* 表格内容 - 只在非加载且无错误时显示 */}
      {!loading && !error && keys.length > 0 && (
        <>
          <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
            )}
            <TableHead>
              <button
                data-testid="sort-name"
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() => handleSort('name')}
              >
                名称
                {sortField === 'name' && (
                  sortOrder === 'asc' ? (
                    <ArrowUp data-testid="sort-icon-asc" className="h-4 w-4" />
                  ) : (
                    <ArrowDown data-testid="sort-icon-desc" className="h-4 w-4" />
                  )
                )}
              </button>
            </TableHead>
            <TableHead>密钥前缀</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>
              <button
                data-testid="sort-created"
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() => handleSort('createdAt')}
              >
                创建时间
                {sortField === 'createdAt' && (
                  sortOrder === 'asc' ? (
                    <ArrowUp data-testid="sort-icon-asc" className="h-4 w-4" />
                  ) : (
                    <ArrowDown data-testid="sort-icon-desc" className="h-4 w-4" />
                  )
                )}
              </button>
            </TableHead>
            <TableHead>使用量</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedKeys.map((key) => {
            const statusInfo = getStatusBadgeVariant(key.status)
            return (
              <TableRow key={key.id} data-testid={`key-row-${key.id}`}>
                {selectable && (
                  <TableCell>
                    <Checkbox
                      data-testid={`checkbox-${key.id}`}
                      checked={selectedKeys.has(key.id)}
                      onCheckedChange={() => handleToggleSelect(key.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-sm">{key.keyMasked}</TableCell>
                <TableCell>
                  <Badge data-testid={`status-${key.id}`} variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{key.totalRequests.toLocaleString()} 次</div>
                    <div className="text-muted-foreground">
                      {key.totalTokens.toLocaleString()} tokens
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {onToggleStatus && (
                      <Button
                        data-testid={`toggle-status-button-${key.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(key)}
                        title={key.status === 'ACTIVE' ? '禁用密钥' : '启用密钥'}
                      >
                        <Power
                          className={`h-4 w-4 ${
                            key.status === 'ACTIVE'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-600'
                          }`}
                        />
                      </Button>
                    )}
                    <Button
                      data-testid={`edit-button-${key.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(key)}
                      title="重命名"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onEditDescription && (
                      <Button
                        data-testid={`edit-description-button-${key.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditDescription(key)}
                        title="编辑描述"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      data-testid={`delete-button-${key.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      data-testid={`copy-button-${key.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(key.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
          </Table>

          {/* 分页控件 */}
          {filteredAndSortedKeys.length > pageSize && (
            <div data-testid="pagination" className="flex items-center justify-between">
              <div data-testid="page-info" className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="prev-page"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                <Button
                  data-testid="next-page"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const KeysTable = React.memo(KeysTableComponent)
