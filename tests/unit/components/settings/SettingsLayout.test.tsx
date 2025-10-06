/**
 * SettingsLayout 组件测试
 * Sprint 14 - Phase 2 🔴 RED
 *
 * 测试设置页面布局组件：
 * - 侧边栏导航渲染
 * - 内容区域渲染
 * - 导航激活状态
 * - 响应式设计
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings/profile',
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('SettingsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('布局渲染', () => {
    it('应该渲染侧边栏导航', () => {
      render(
        <SettingsLayout>
          <div>Settings Content</div>
        </SettingsLayout>
      )

      expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument()
    })

    it('应该渲染内容区域', () => {
      render(
        <SettingsLayout>
          <div data-testid="content">Settings Content</div>
        </SettingsLayout>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByText('Settings Content')).toBeInTheDocument()
    })

    it('应该显示所有导航菜单项', () => {
      render(
        <SettingsLayout>
          <div>Settings Content</div>
        </SettingsLayout>
      )

      expect(screen.getByText('个人信息')).toBeInTheDocument()
      expect(screen.getByText('安全设置')).toBeInTheDocument()
      expect(screen.getByText('通知设置')).toBeInTheDocument()
      expect(screen.getByText('到期提醒')).toBeInTheDocument()
    })
  })

  describe('导航激活状态', () => {
    it('应该高亮当前激活的标签', () => {
      render(
        <SettingsLayout>
          <div>Settings Content</div>
        </SettingsLayout>
      )

      const profileLink = screen.getByText('个人信息').closest('a')
      expect(profileLink).toHaveClass('active')
    })
  })

  describe('响应式设计', () => {
    it('移动端应该显示折叠的侧边栏', () => {
      // Mock small screen
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      render(
        <SettingsLayout>
          <div>Settings Content</div>
        </SettingsLayout>
      )

      const sidebar = screen.getByTestId('settings-sidebar')
      expect(sidebar).toHaveClass('hidden', 'lg:block')
    })
  })
})
