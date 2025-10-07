/**
 * 设置页面布局
 * Sprint 14 - Phase 3 🟢 GREEN
 */

import { SettingsLayout } from '@/components/settings/SettingsLayout'

export const metadata = {
  title: '设置 - Claude Key Portal',
  description: '管理您的账号设置和偏好',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">账号设置</h1>
        <p className="text-muted-foreground mt-2">
          管理您的个人信息、安全设置和通知偏好
        </p>
      </div>

      <SettingsLayout>{children}</SettingsLayout>
    </div>
  )
}
