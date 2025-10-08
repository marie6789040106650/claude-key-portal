/**
 * 安全设置页面
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SecurityTab } from '@/components/settings/SecurityTab'

export const metadata = {
  title: '安全设置 - 设置',
  description: '修改密码和管理登录会话',
}

export default function SecuritySettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">安全设置</h1>
          <p className="mt-1 text-sm text-gray-600">
            修改密码和管理登录会话
          </p>
        </div>
        <SecurityTab />
      </div>
    </SettingsLayout>
  )
}
