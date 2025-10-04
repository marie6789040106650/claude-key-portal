/**
 * DashboardLayout - 仪表板布局组件
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 集成已实现的组件：
 * - TopNav (顶部导航)
 * - Sidebar (侧边栏)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    nickname: string
    avatarUrl?: string
  } | null
  className?: string
}

export function DashboardLayout({ children, user, className = '' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕大小
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // 移动端默认隐藏，桌面端默认显示
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div
      role="main"
      className={`dashboard-layout min-h-screen bg-gray-50 ${className}`}
    >
      {/* 顶部导航 */}
      <div className="dashboard-header fixed top-0 left-0 right-0 z-30">
        <TopNav
          onMenuToggle={handleMenuToggle}
          user={user || null}
        />
      </div>

      {/* 主体区域 */}
      <div
        className={`dashboard-body flex pt-16 ${
          sidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
      >
        {/* 侧边栏 */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />

        {/* 主内容区 */}
        <main
          className={`dashboard-main flex-1 p-6 transition-all duration-300 ${
            sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
