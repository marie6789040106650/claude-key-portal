/**
 * UserInfoCard - 用户信息卡片组件
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 复用原则：
 * - 使用 shadcn/ui Card 组件
 * - 使用现有的 Button 组件
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  email: string
  nickname?: string
  avatarUrl?: string
  createdAt?: string
  apiKeyCount?: number
  totalRequests?: number
  status?: 'active' | 'disabled' | 'pending'
}

interface UserInfoCardProps {
  user: User
  editable?: boolean
  loading?: boolean
  error?: string
  compact?: boolean
  className?: string
  onAvatarUpload?: (file: File) => Promise<void>
  onUpdate?: (data: Partial<User>) => Promise<void>
  onRetry?: () => void
}

export function UserInfoCard({
  user,
  editable = false,
  loading = false,
  error,
  compact = false,
  className = '',
  onAvatarUpload,
  onUpdate,
  onRetry,
}: UserInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({ nickname: user.nickname || '' })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getUserInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('只支持图片格式')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    if (onAvatarUpload) {
      await onAvatarUpload(file)
    }
  }

  const handleSubmit = async () => {
    if (onUpdate) {
      await onUpdate(formData)
      setIsEditing(false)
    }
  }

  if (loading) {
    return (
      <Card
        role="region"
        aria-label="用户信息"
        className={`bg-white rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'} ${className}`}
      >
        <div className="flex items-center space-x-4">
          <div data-testid="skeleton-avatar" className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1">
            <div data-testid="skeleton-name" className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2" />
            <div data-testid="skeleton-email" className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'} ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry}>重试</Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card
      role="region"
      aria-label="用户信息"
      className={`bg-white rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* 头像 */}
          <div className="relative">
            {editable && (
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  aria-label="选择图片"
                />
              </label>
            )}

            <div
              data-testid="user-avatar"
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                editable ? 'cursor-pointer hover:opacity-80' : ''
              }`}
              onClick={() => editable && document.getElementById('avatar-upload')?.click()}
              style={{ backgroundColor: user.avatarUrl ? 'transparent' : '#2563EB' }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getUserInitials(user.nickname || user.email)
              )}
            </div>
          </div>

          {/* 用户信息 */}
          <div className="flex-1 min-w-0">
            {!isEditing ? (
              <>
                <h3 className="text-xl font-bold truncate max-w-[200px]">
                  {user.nickname || user.email}
                </h3>
                <p className="text-gray-600 text-sm truncate max-w-[300px]">{user.email}</p>

                {user.createdAt && (
                  <p className="text-gray-500 text-xs mt-1">
                    注册于 {formatDate(user.createdAt)}
                  </p>
                )}

                {user.status && (
                  <div className="mt-2">
                    <span
                      data-testid="account-status"
                      className={`text-xs px-2 py-1 rounded ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-600'
                          : user.status === 'disabled'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {user.status === 'active' ? '正常' : user.status === 'disabled' ? '已禁用' : '待验证'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="nickname">昵称</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" value={user.email} disabled />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSubmit}>保存</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {editable && !isEditing && (
          <div className="flex flex-col space-y-2">
            <Button size="sm" onClick={() => setIsEditing(true)}>
              编辑资料
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsChangingPassword(true)}>
              修改密码
            </Button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {(user.apiKeyCount !== undefined || user.totalRequests !== undefined) && (
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          {user.apiKeyCount !== undefined && (
            <div className="text-center">
              <div className="text-2xl font-bold">{user.apiKeyCount}</div>
              <div className="text-sm text-gray-500">个密钥</div>
            </div>
          )}
          {user.totalRequests !== undefined && (
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(user.totalRequests)}</div>
              <div className="text-sm text-gray-500">次请求</div>
            </div>
          )}
        </div>
      )}

      {/* 修改密码对话框 */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-bold mb-4">修改密码</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">当前密码</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setIsChangingPassword(false)} className="flex-1">
                  确定
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
