/**
 * TopNav - 顶部导航栏组件
 * Sprint 11 - Phase 5 🟢 GREEN
 */

'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TopNavProps {
  onMenuToggle: () => void
  user: {
    id: string
    email: string
    nickname: string
    avatarUrl?: string
  } | null
  unreadNotifications?: number
  loading?: boolean
  className?: string
}

function TopNavComponent({
  onMenuToggle,
  user,
  unreadNotifications = 0,
  loading = false,
  className = '',
}: TopNavProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [router])

  const getUserInitials = useCallback((nickname: string) => {
    return nickname
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  if (loading) {
    return (
      <nav
        role="navigation"
        className={`bg-white dark:bg-gray-800 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse hidden md:block" />
          </div>
          <div data-testid="skeleton-avatar" className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </nav>
    )
  }

  return (
    <nav
      role="navigation"
      className={`bg-white dark:bg-gray-800 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between p-4">
        {/* 左侧：菜单按钮 + Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            aria-label="Toggle menu"
            tabIndex={0}
            className="p-2 hover:bg-gray-100 rounded-md"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onMenuToggle()
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }} />
            <span className="text-xl font-bold hidden md:block">Claude Key Portal</span>
          </div>
        </div>

        {/* 右侧：通知 + 用户菜单 */}
        <div className="flex items-center space-x-4">
          {/* 通知按钮 */}
          <div ref={notificationMenuRef} className="relative">
            <button
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              aria-label="Notifications"
              tabIndex={0}
              className="p-2 hover:bg-gray-100 rounded-md relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="notification-badge absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                  通知列表
                </div>
                <div className="px-4 py-2 text-sm text-gray-500">
                  暂无新通知
                </div>
              </div>
            )}
          </div>

          {/* 用户菜单 */}
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                data-testid="user-avatar"
                tabIndex={0}
                className="flex items-center space-x-2 hover:bg-gray-100 rounded-md p-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getUserInitials(user.nickname)}
                  </div>
                )}
                <span className="hidden sm:block truncate max-w-[120px]">{user.nickname}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      router.push('/dashboard/settings')
                      setUserMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    个人设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={() => router.push('/login')}>登录</Button>
          )}
        </div>
      </div>
    </nav>
  )
}

// 使用 memo 优化性能，避免不必要的重新渲染
export const TopNav = memo(TopNavComponent)
