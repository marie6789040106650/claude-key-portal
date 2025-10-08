/**
 * 设置页面主入口
 * Sprint MVP - Phase 2 🟢 GREEN
 *
 * 自动重定向到第一个设置标签页（个人信息）
 */

import { redirect } from 'next/navigation'
import { SETTINGS_NAV_ITEMS } from '@/constants/settings'

export default function SettingsPage() {
  // 自动重定向到第一个设置项（个人信息）
  redirect(SETTINGS_NAV_ITEMS[0].href)
}
