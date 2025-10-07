/**
 * 注册页面
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 与CRS集成：
 * - 调用 POST /api/auth/register (Sprint 1 已实现)
 * - 注册成功后自动登录
 * - 无需直接接触CRS
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()

  // 自动跳转：已登录用户直接跳转到 dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        })
        if (response.ok) {
          router.push('/dashboard')
        }
      } catch (error) {
        // 未登录，继续显示注册页
      }
    }
    checkAuth()
  }, [router])

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateForm = () => {
    if (!formData.nickname.trim()) {
      setError('请输入昵称')
      return false
    }

    if (formData.password.length < 8) {
      setError('密码长度至少8位')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '注册失败')
      }

      // 注册成功，跳转到登录页
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
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
          <h2 className="text-2xl font-semibold">创建账号</h2>
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
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="您的昵称"
                className="mt-1"
              />
            </div>

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
                placeholder="至少8位字符"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                密码应包含大小写字母、数字和特殊符号
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? '注册中...' : '注册'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">已有账号？</span>
            <Link href="/login" className="text-blue-600 hover:text-blue-500 ml-1">
              登录
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
