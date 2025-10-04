/**
 * TopNav 组件测试
 * Sprint 11 - Phase 4 🔴 RED
 *
 * 测试顶部导航栏组件:
 * - Logo和标题显示
 * - 菜单切换按钮
 * - 用户菜单
 * - 通知功能
 * - 响应式设计
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TopNav } from '@/components/dashboard/TopNav'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('TopNav', () => {
  const mockOnMenuToggle = jest.fn()
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染Logo和标题', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      expect(screen.getByText('Claude Key Portal')).toBeInTheDocument()
      expect(screen.getByAltText('Logo')).toBeInTheDocument()
    })

    it('应该显示菜单切换按钮', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const toggleButton = screen.getByLabelText('Toggle menu')
      expect(toggleButton).toBeInTheDocument()
    })

    it('应该显示用户信息', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('应该显示用户头像', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveTextContent('TU') // Test User首字母
    })
  })

  describe('菜单切换功能', () => {
    it('点击菜单按钮应该触发回调', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const toggleButton = screen.getByLabelText('Toggle menu')
      fireEvent.click(toggleButton)

      expect(mockOnMenuToggle).toHaveBeenCalledTimes(1)
    })

    it('应该支持键盘操作', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const toggleButton = screen.getByLabelText('Toggle menu')
      fireEvent.keyDown(toggleButton, { key: 'Enter' })

      expect(mockOnMenuToggle).toHaveBeenCalled()
    })
  })

  describe('用户菜单', () => {
    it('点击用户头像应该展开菜单', async () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        expect(screen.getByText('个人设置')).toBeInTheDocument()
        expect(screen.getByText('退出登录')).toBeInTheDocument()
      })
    })

    it('点击个人设置应该跳转', async () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        const settingsLink = screen.getByText('个人设置')
        fireEvent.click(settingsLink)
      })

      // 验证路由跳转（通过mock验证）
    })

    it('点击退出登录应该清除session', async () => {
      const mockLogout = jest.fn()
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock

      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        const logoutButton = screen.getByText('退出登录')
        fireEvent.click(logoutButton)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
        })
      })
    })

    it('点击菜单外部应该关闭菜单', async () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        expect(screen.getByText('退出登录')).toBeInTheDocument()
      })

      // 点击外部区域
      fireEvent.click(document.body)

      await waitFor(() => {
        expect(screen.queryByText('退出登录')).not.toBeInTheDocument()
      })
    })
  })

  describe('通知功能', () => {
    it('应该显示通知按钮', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const notificationButton = screen.getByLabelText('Notifications')
      expect(notificationButton).toBeInTheDocument()
    })

    it('有未读通知时应该显示徽章', () => {
      render(
        <TopNav
          onMenuToggle={mockOnMenuToggle}
          user={mockUser}
          unreadNotifications={5}
        />
      )

      const badge = screen.getByText('5')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('notification-badge')
    })

    it('点击通知按钮应该展开通知列表', async () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const notificationButton = screen.getByLabelText('Notifications')
      fireEvent.click(notificationButton)

      await waitFor(() => {
        expect(screen.getByText('通知列表')).toBeInTheDocument()
      })
    })
  })

  describe('响应式设计', () => {
    it('移动端应该隐藏Logo文字，只显示图标', () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const logoText = screen.queryByText('Claude Key Portal')
      expect(logoText).toHaveClass('hidden', 'md:block')
    })

    it('移动端应该隐藏用户昵称', () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const nickname = screen.queryByText('Test User')
      expect(nickname).toHaveClass('hidden', 'sm:block')
    })

    it('桌面端应该显示完整信息', () => {
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))

      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      expect(screen.getByText('Claude Key Portal')).toBeVisible()
      expect(screen.getByText('Test User')).toBeVisible()
    })
  })

  describe('样式和主题', () => {
    it('应该支持自定义className', () => {
      const { container } = render(
        <TopNav
          onMenuToggle={mockOnMenuToggle}
          user={mockUser}
          className="custom-nav"
        />
      )

      expect(container.firstChild).toHaveClass('custom-nav')
    })

    it('应该应用正确的背景色', () => {
      const { container } = render(
        <TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />
      )

      const nav = container.firstChild
      expect(nav).toHaveClass('bg-white', 'dark:bg-gray-800')
    })

    it('应该有阴影效果', () => {
      const { container } = render(
        <TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />
      )

      const nav = container.firstChild
      expect(nav).toHaveClass('shadow-sm')
    })
  })

  describe('加载状态', () => {
    it('应该处理用户未登录状态', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={null} />)

      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
      expect(screen.getByText('登录')).toBeInTheDocument()
    })

    it('应该显示骨架屏（加载中）', () => {
      render(
        <TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} loading />
      )

      expect(screen.getByTestId('skeleton-avatar')).toBeInTheDocument()
    })
  })

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
    })

    it('应该支持Tab键导航', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const toggleButton = screen.getByLabelText('Toggle menu')
      const notificationButton = screen.getByLabelText('Notifications')
      const avatar = screen.getByTestId('user-avatar')

      expect(toggleButton).toHaveAttribute('tabIndex', '0')
      expect(notificationButton).toHaveAttribute('tabIndex', '0')
      expect(avatar).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('边界条件', () => {
    it('应该处理超长用户名', () => {
      const longNameUser = {
        ...mockUser,
        nickname: 'Very Long User Name That Should Be Truncated',
      }

      render(<TopNav onMenuToggle={mockOnMenuToggle} user={longNameUser} />)

      const nickname = screen.getByText(longNameUser.nickname)
      expect(nickname).toHaveClass('truncate', 'max-w-[120px]')
    })

    it('应该处理缺失用户头像', () => {
      render(<TopNav onMenuToggle={mockOnMenuToggle} user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      // 应该显示首字母作为后备
      expect(avatar).toHaveTextContent('TU')
    })

    it('应该处理大量未读通知', () => {
      render(
        <TopNav
          onMenuToggle={mockOnMenuToggle}
          user={mockUser}
          unreadNotifications={999}
        />
      )

      const badge = screen.getByText('99+')
      expect(badge).toBeInTheDocument()
    })
  })
})
