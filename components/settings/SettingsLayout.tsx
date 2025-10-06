/**
 * 设置页面布局组件
 * Sprint 14 - Phase 3 🟢 GREEN
 */

'use client'

import { SettingsNav } from './SettingsNav'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 侧边栏导航 */}
      <aside
        data-testid="settings-sidebar"
        className="hidden lg:block w-64 flex-shrink-0"
      >
        <div className="sticky top-20">
          <h2 className="text-lg font-semibold mb-4">设置</h2>
          <SettingsNav />
        </div>
      </aside>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
