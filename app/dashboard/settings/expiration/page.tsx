/**
 * 到期提醒设置页面
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { ExpirationTab } from '@/components/settings/ExpirationTab'

export const metadata = {
  title: '到期提醒 - 设置',
  description: '设置密钥到期提醒规则',
}

export default function ExpirationSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">到期提醒</h1>
          <p className="mt-1 text-sm text-gray-600">
            设置密钥到期提醒规则
          </p>
        </div>
        <ExpirationTab />
      </div>
    </SettingsLayout>
  )
}
