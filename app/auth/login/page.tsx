/**
 * 登录页面
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 与CRS集成：
 * - 调用 POST /api/auth/login (Sprint 1 已实现)
 * - API会返回JWT token
 * - 无需直接接触CRS
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // 自动跳转：已登录用户直接跳转到 dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        })
        if (response.ok) {
          router.push(redirectTo)
        }
      } catch (error) {
        // 未登录，继续显示登录页
      }
    }
    checkAuth()
  }, [router, redirectTo])

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 保存 token 到 cookie (由API自动设置)
      // 跳转到目标页面
      router.push(redirectTo)
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Claude Key Portal</h1>
          <p className="mt-2 text-sm text-gray-600">CRS 用户管理门户</p>
        </div>

        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">欢迎回来</h2>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          </div>

          {/* 记住我 和 忘记密码 */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="remember"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">记住我</span>
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              忘记密码？
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">还没有账号？</span>
            <Link href="/register" className="text-blue-600 hover:text-blue-500 ml-1">
              注册
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
