/**
 * 个人信息设置页面
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { ProfileTab } from '@/components/settings/ProfileTab'

export const metadata = {
  title: '个人信息 - 设置',
  description: '管理您的个人资料和账号信息',
}

export default function ProfileSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">个人信息</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理您的个人资料和账号信息
          </p>
        </div>
        <ProfileTab />
      </div>
    </SettingsLayout>
  )
}
