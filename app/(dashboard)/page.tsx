/**
 * 仪表板首页
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 与CRS集成：
 * - 调用 GET /api/dashboard (Sprint 4 已实现，代理CRS)
 * - 调用 GET /api/user/profile (Sprint 5 已实现)
 * - 展示用户信息和密钥总览
 */

'use client'

import { useEffect, useState } from 'react'
import { UserInfoCard } from '@/components/dashboard/UserInfoCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DashboardData {
  user: {
    id: string
    email: string
    nickname: string
    createdAt: string
    avatarUrl?: string
  }
  stats: {
    totalKeys: number
    totalRequests: number
    activeKeys: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      // 获取仪表板数据（通过我们的API，API会代理CRS）
      const response = await fetch('/api/dashboard', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadDashboard}>重试</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          欢迎, {data?.user.nickname}！
        </h1>
        <p className="text-gray-600 mt-2">
          这是您的仪表板，查看和管理您的 API 密钥
        </p>
      </div>

      {/* 快速操作 */}
      <div className="flex space-x-4">
        <Button onClick={() => router.push('/dashboard/keys')}>
          管理密钥
        </Button>
        <Button variant="outline" onClick={() => router.push('/dashboard/monitoring')}>
          查看监控
        </Button>
      </div>

      {/* 密钥总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {data?.stats.totalKeys || 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">总密钥数</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {data?.stats.activeKeys || 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">活跃密钥</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {data?.stats.totalRequests ? new Intl.NumberFormat('zh-CN').format(data.stats.totalRequests) : 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">总请求数</div>
          </div>
        </Card>
      </div>

      {/* 用户信息卡片 */}
      {data?.user && (
        <UserInfoCard
          user={{
            ...data.user,
            apiKeyCount: data.stats.totalKeys,
            totalRequests: data.stats.totalRequests,
            status: 'active',
          }}
          editable={true}
        />
      )}

      {/* 最近活动 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">最近活动</h2>
        <div className="text-gray-500 text-center py-8">
          暂无活动记录
        </div>
      </Card>
    </div>
  )
}
