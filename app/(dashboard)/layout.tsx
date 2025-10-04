/**
 * 仪表板布局
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 使用 DashboardLayout 组件
 * 集成用户信息获取（从 /api/user/profile）
 */

import { cookies } from 'next/headers'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

async function getUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return null
    }

    // 调用我们的API（不直接调用CRS）
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
