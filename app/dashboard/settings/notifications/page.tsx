/**
 * 通知设置页面
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { NotificationsTab } from '@/components/settings/NotificationsTab'

export const metadata = {
  title: '通知设置 - 设置',
  description: '配置邮件和系统通知',
}

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知设置</h1>
          <p className="mt-1 text-sm text-gray-600">
            配置邮件和系统通知
          </p>
        </div>
        <NotificationsTab />
      </div>
    </SettingsLayout>
  )
}
