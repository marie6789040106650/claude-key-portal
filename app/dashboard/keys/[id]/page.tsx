'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Edit, Trash2, Star, Calendar, Activity } from 'lucide-react'
import { toast } from '@/components/ui/toast-simple'
import type { ApiKeyStatus } from '@/types/keys'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface KeyDetailPageProps {
  params: {
    id: string
  }
}

/**
 * 密钥详情数据接口
 * 扩展了基础的ApiKey类型，添加了Portal特有的字段
 */
interface KeyDetailData {
  id: string
  name: string
  crsKey: string
  status: ApiKeyStatus
  description: string | null
  tags: string[]
  notes: string | null
  isFavorite: boolean
  monthlyUsage: number
  totalCalls: number
  totalTokens: number
  createdAt: string
  lastUsedAt: string | null
  updatedAt: string
}

/**
 * 趋势数据点接口
 */
interface TrendDataPoint {
  timestamp: string
  tokens: number
  requests: number
}

/**
 * 实时统计数据接口
 */
interface RealtimeStats {
  key: {
    id: string
    name: string
    status: string
    totalTokens: number
    totalRequests: number
    createdAt: string
    lastUsedAt: string | null
    realtimeStats?: {
      totalTokens: number
      totalRequests: number
      averageTokensPerRequest: number
    }
  }
  crsWarning?: string
}

/**
 * 获取密钥状态对应的样式类名
 */
function getStatusBadgeClass(status: ApiKeyStatus): string {
  const baseClass = 'hover:bg-opacity-90'
  const statusClasses: Record<ApiKeyStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
    INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    EXPIRED: 'bg-red-100 text-red-800 hover:bg-red-100',
    DELETED: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    RATE_LIMITED: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
}

/**
 * 使用趋势图表组件
 */
function UsageTrendChart({ data }: { data: TrendDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无趋势数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          labelFormatter={(value) => {
            const date = new Date(value as string)
            return date.toLocaleDateString('zh-CN')
          }}
          formatter={(value: number) => [value.toLocaleString(), '']}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="requests"
          stroke="#8884d8"
          name="请求数"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="tokens"
          stroke="#82ca9d"
          name="Token数"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function KeyDetailPage({ params }: KeyDetailPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取密钥详情
  const {
    data: keyData,
    isLoading,
    error,
    refetch,
  } = useQuery<KeyDetailData>({
    queryKey: ['key-details', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/keys/${params.id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '加载失败')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分钟
  })

  // 获取实时统计数据（包含趋势）
  const {
    data: realtimeStats,
    isLoading: isLoadingRealtime,
  } = useQuery<RealtimeStats>({
    queryKey: ['key-stats-realtime', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/stats/usage?keyId=${params.id}&realtime=true`)
      if (!response.ok) throw new Error('获取失败')
      return response.json()
    },
    staleTime: 10 * 1000, // 10秒刷新一次
    enabled: !!keyData, // 只有在密钥数据加载后才获取实时统计
  })

  // 获取趋势数据（最近7天）
  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useQuery<{ trend?: TrendDataPoint[]; trendWarning?: string }>({
    queryKey: ['key-trend', params.id],
    queryFn: async () => {
      // 计算最近7天的日期范围
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)

      const startDate = sevenDaysAgo.toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const response = await fetch(
        `/api/stats/usage?keyId=${params.id}&startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) throw new Error('获取失败')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5分钟刷新一次
    enabled: !!keyData, // 只有在密钥数据加载后才获取趋势数据
  })

  // 处理删除
  const handleDelete = async () => {
    if (!keyData) return

    const confirmed = window.confirm(`确定要删除密钥 "${keyData.name}" 吗？此操作无法撤销。`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/keys/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      toast('密钥已删除', 'success', 2000)
      router.push('/dashboard/keys')
    } catch (error: any) {
      toast(error.message || '删除失败，请稍后重试', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // 处理编辑
  const handleEdit = () => {
    router.push(`/dashboard/keys/${params.id}/edit`)
  }

  // 处理返回
  const handleBack = () => {
    router.back()
  }

  // 处理刷新
  const handleRefresh = async () => {
    await refetch()
    toast('数据已刷新', 'success', 2000)
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div data-testid="key-detail-skeleton" className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-64" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    const errorMessage = (error as Error).message
    const is404 = errorMessage.includes('不存在')
    const is403 = errorMessage.includes('无权访问')

    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {is404 && '密钥不存在'}
              {is403 && '无权访问此密钥'}
              {!is404 && !is403 && '加载失败，请稍后重试'}
            </p>
            {!is404 && !is403 && (
              <Button onClick={handleRefresh} variant="outline" data-testid="retry-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!keyData) {
    return null
  }

  return (
    <div data-testid="key-detail-container" className="container mx-auto py-8 space-y-6">
      {/* 导航和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{keyData.name}</h1>
            {keyData.isFavorite && (
              <Star
                data-testid="favorite-icon"
                className="w-6 h-6 text-yellow-500 fill-yellow-500"
              />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            data-testid="refresh-button"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            data-testid="edit-button"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            data-testid="delete-button"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge className={`mt-1 ${getStatusBadgeClass(keyData.status)}`}>
                {keyData.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">
                  {new Date(keyData.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最后使用</p>
              <div className="flex items-center gap-2 mt-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">
                  {keyData.lastUsedAt
                    ? new Date(keyData.lastUsedAt).toLocaleString('zh-CN')
                    : '从未使用'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本月使用量</p>
              <p className="mt-1 font-medium text-lg">
                {keyData.monthlyUsage.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">密钥值（已脱敏）</p>
            <code className="block bg-muted px-4 py-3 rounded font-mono text-sm break-all">
              {keyData.crsKey}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* 使用统计卡片 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总请求数
              </CardTitle>
              {realtimeStats?.key?.realtimeStats && (
                <Badge variant="outline" className="text-xs">
                  实时
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRealtime ? (
              <div className="h-8 bg-muted animate-pulse rounded w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  realtimeStats?.key?.realtimeStats?.totalRequests ??
                  keyData.totalCalls
                ).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总 Token 数
              </CardTitle>
              {realtimeStats?.key?.realtimeStats && (
                <Badge variant="outline" className="text-xs">
                  实时
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRealtime ? (
              <div className="h-8 bg-muted animate-pulse rounded w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  realtimeStats?.key?.realtimeStats?.totalTokens ??
                  keyData.totalTokens
                ).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均 Token/请求
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRealtime ? (
              <div className="h-8 bg-muted animate-pulse rounded w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  realtimeStats?.key?.realtimeStats?.averageTokensPerRequest ??
                  (keyData.totalCalls > 0
                    ? Math.round(keyData.totalTokens / keyData.totalCalls)
                    : 0)
                ).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRS警告提示 */}
      {realtimeStats?.crsWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{realtimeStats.crsWarning}</p>
        </div>
      )}

      {/* 使用趋势图表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>使用趋势（最近7天）</CardTitle>
            {isLoadingTrend && (
              <Badge variant="outline" className="text-xs">
                加载中...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTrend ? (
            <div className="h-64 bg-muted animate-pulse rounded" />
          ) : trendData?.trend && trendData.trend.length > 0 ? (
            <UsageTrendChart data={trendData.trend} />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {trendData?.trendWarning || '暂无趋势数据'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 描述和标签 */}
      <Card>
        <CardHeader>
          <CardTitle>描述和标签</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">描述</p>
            <p className="text-base">
              {keyData.description || '暂无描述'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">标签</p>
            {keyData.tags && keyData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keyData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无标签</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 备注 */}
      <Card>
        <CardHeader>
          <CardTitle>备注</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base whitespace-pre-wrap">
            {keyData.notes || '暂无备注'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
