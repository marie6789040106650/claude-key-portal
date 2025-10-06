/**
 * 设置页面导航配置
 * Sprint 14 - Phase 3 🟢 GREEN
 */

import { User, Shield, Bell, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SettingsNavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    key: 'profile',
    label: '个人信息',
    href: '/dashboard/settings/profile',
    icon: User,
    description: '管理您的个人资料和账号信息',
  },
  {
    key: 'security',
    label: '安全设置',
    href: '/dashboard/settings/security',
    icon: Shield,
    description: '修改密码和管理登录会话',
  },
  {
    key: 'notifications',
    label: '通知设置',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    description: '配置邮件和系统通知',
  },
  {
    key: 'expiration',
    label: '到期提醒',
    href: '/dashboard/settings/expiration',
    icon: Clock,
    description: '设置密钥到期提醒规则',
  },
]
