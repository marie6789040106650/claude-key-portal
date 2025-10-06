/**
 * 设置页面导航组件
 * Sprint 14 - Phase 3 🟢 GREEN
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SETTINGS_NAV_ITEMS } from '@/constants/settings'

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {SETTINGS_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              'hover:bg-accent',
              isActive
                ? 'active bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
