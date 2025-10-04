/**
 * Sidebar - 侧边栏导航组件
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 复用原则：不重复造轮子
 * - 使用 Next.js Link 组件
 * - 使用 shadcn/ui 样式系统
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  keyCount?: number
  unreadNotifications?: number
  onClose?: () => void
  className?: string
}

const NAV_ITEMS = [
  {
    group: '核心功能',
    items: [
      { name: '首页', href: '/dashboard', icon: 'home' },
      { name: '密钥管理', href: '/dashboard/keys', icon: 'keys', showBadge: true },
      { name: '监控', href: '/dashboard/monitoring', icon: 'monitor' },
      { name: '统计', href: '/dashboard/stats', icon: 'stats' },
    ],
  },
  {
    group: '系统管理',
    items: [
      { name: '安装指导', href: '/dashboard/install', icon: 'install' },
      { name: '设置', href: '/dashboard/settings', icon: 'settings' },
    ],
  },
]

const ICONS: Record<string, JSX.Element> = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  keys: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  monitor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  stats: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  install: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export function Sidebar({
  isOpen,
  keyCount = 0,
  unreadNotifications = 0,
  onClose,
  className = '',
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        />
      )}

      {/* 侧边栏 */}
      <aside
        role="navigation"
        aria-label="侧边栏导航"
        className={`
          ${isOpen ? 'w-64' : 'w-16'}
          ${isOpen ? 'fixed md:static' : 'hidden md:block'}
          bg-gray-900 dark:bg-gray-950 text-white
          transition-all duration-300 ease-in-out
          h-screen overflow-y-auto
          z-50
          ${className}
        `}
      >
        <div className="p-4">
          {isOpen && (
            <h2 className="text-sm font-semibold text-gray-400 mb-4">导航菜单</h2>
          )}

          {NAV_ITEMS.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {isOpen && (
                <>
                  <h3 className="text-xs font-semibold text-gray-400 mb-2">{group.group}</h3>
                  {groupIndex > 0 && <div className="divider border-t border-gray-700 my-4" />}
                </>
              )}

              <nav>
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.name}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md mb-1
                        transition-colors
                        ${active ? 'bg-blue-600 active' : 'hover:bg-gray-800'}
                        ${!isOpen && 'justify-center'}
                      `}
                    >
                      <span data-testid={`icon-${item.icon}`} className="relative">
                        {ICONS[item.icon]}
                        {item.showBadge && keyCount > 0 && !isOpen && (
                          <span className="badge absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs bg-red-600 rounded-full">
                            {keyCount > 99 ? '99+' : keyCount}
                          </span>
                        )}
                      </span>
                      <span className={isOpen ? '' : 'hidden'}>{item.name}</span>
                      {item.showBadge && keyCount > 0 && isOpen && (
                        <span className="badge ml-auto px-2 py-0.5 text-xs bg-red-600 rounded-full">
                          {keyCount > 99 ? '99+' : keyCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
