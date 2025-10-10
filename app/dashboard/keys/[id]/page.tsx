'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Edit, Trash2, Star, Calendar, Activity } from 'lucide-react'
import { toast } from '@/components/ui/toast-simple'

interface KeyDetailPageProps {
  params: {
    id: string
  }
}

interface KeyData {
  id: string
  name: string
  crsKey: string
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'EXPIRED'
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
  } = useQuery<KeyData>({
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

  // 获取状态样式
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

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
              <Badge className={`mt-1 ${getStatusVariant(keyData.status)}`}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总请求数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keyData.totalCalls.toLocaleString()}
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
              {keyData.totalTokens.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              本月使用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keyData.monthlyUsage.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

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
