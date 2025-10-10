/**
 * 仪表板首页客户端组件
 * Sprint 11 - Phase 5 🟢 GREEN
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

export function DashboardPageClient() {
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

      const response = await fetch('/api/dashboard', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('获取数据失败')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button onClick={loadDashboard}>重试</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <UserInfoCard user={data.user} />

      {/* 统计概览 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">总密钥数</h3>
          <p className="text-3xl font-bold mt-2">{data.stats.totalKeys}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">活跃密钥</h3>
          <p className="text-3xl font-bold mt-2">{data.stats.activeKeys}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">总请求数</h3>
          <p className="text-3xl font-bold mt-2">
            {data.stats.totalRequests.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* 快捷操作 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button onClick={() => router.push('/dashboard/keys')} className="w-full">
            管理密钥
          </Button>
          <Button onClick={() => router.push('/dashboard/stats')} variant="outline" className="w-full">
            查看统计
          </Button>
          <Button onClick={() => router.push('/dashboard/keys/install')} variant="outline" className="w-full">
            安装指南
          </Button>
        </div>
      </Card>
    </div>
  )
}
