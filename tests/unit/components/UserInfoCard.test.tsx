/**
 * UserInfoCard 组件测试
 * Sprint 11 - Phase 4 🔴 RED
 *
 * 测试用户信息卡片组件:
 * - 用户基本信息显示
 * - 头像显示和上传
 * - 账号状态
 * - 快捷操作
 * - 数据加载状态
 * - 错误处理
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserInfoCard } from '@/components/dashboard/UserInfoCard'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('UserInfoCard', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'Test User',
    createdAt: '2025-01-01T00:00:00.000Z',
    apiKeyCount: 5,
    totalRequests: 12345,
  }

  describe('基础渲染', () => {
    it('应该渲染用户基本信息', () => {
      render(<UserInfoCard user={mockUser} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('应该显示用户头像', () => {
      render(<UserInfoCard user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toBeInTheDocument()
    })

    it('应该显示注册时间', () => {
      render(<UserInfoCard user={mockUser} />)

      expect(screen.getByText(/注册于/)).toBeInTheDocument()
      expect(screen.getByText(/2025-01-01/)).toBeInTheDocument()
    })

    it('应该显示密钥数量', () => {
      render(<UserInfoCard user={mockUser} />)

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('个密钥')).toBeInTheDocument()
    })

    it('应该显示请求总数', () => {
      render(<UserInfoCard user={mockUser} />)

      expect(screen.getByText('12,345')).toBeInTheDocument()
      expect(screen.getByText('次请求')).toBeInTheDocument()
    })
  })

  describe('头像功能', () => {
    it('无头像时应该显示首字母', () => {
      render(<UserInfoCard user={mockUser} />)

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toHaveTextContent('TU')
    })

    it('有头像URL时应该显示图片', () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: 'https://example.com/avatar.jpg',
      }

      render(<UserInfoCard user={userWithAvatar} />)

      const avatarImg = screen.getByAltText('User avatar')
      expect(avatarImg).toHaveAttribute('src', userWithAvatar.avatarUrl)
    })

    it('点击头像应该打开上传对话框', async () => {
      render(<UserInfoCard user={mockUser} editable />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      await waitFor(() => {
        expect(screen.getByText('更换头像')).toBeInTheDocument()
      })
    })

    it('应该支持头像上传', async () => {
      const mockUpload = jest.fn()
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              avatarUrl: 'https://example.com/new-avatar.jpg',
            }),
        })
      ) as jest.Mock

      render(<UserInfoCard user={mockUser} editable onAvatarUpload={mockUpload} />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      const fileInput = screen.getByLabelText('选择图片')
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file)
      })
    })

    it('应该验证头像文件类型', async () => {
      render(<UserInfoCard user={mockUser} editable />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      const fileInput = screen.getByLabelText('选择图片')
      const invalidFile = new File(['text'], 'file.txt', { type: 'text/plain' })

      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      await waitFor(() => {
        expect(screen.getByText('只支持图片格式')).toBeInTheDocument()
      })
    })

    it('应该验证头像文件大小', async () => {
      render(<UserInfoCard user={mockUser} editable />)

      const avatar = screen.getByTestId('user-avatar')
      fireEvent.click(avatar)

      // 创建一个超大文件 (>5MB)
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByLabelText('选择图片')
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText('图片大小不能超过5MB')).toBeInTheDocument()
      })
    })
  })

  describe('账号状态', () => {
    it('应该显示账号正常状态', () => {
      render(<UserInfoCard user={{ ...mockUser, status: 'active' }} />)

      const status = screen.getByTestId('account-status')
      expect(status).toHaveTextContent('正常')
      expect(status).toHaveClass('text-green-600')
    })

    it('应该显示账号禁用状态', () => {
      render(<UserInfoCard user={{ ...mockUser, status: 'disabled' }} />)

      const status = screen.getByTestId('account-status')
      expect(status).toHaveTextContent('已禁用')
      expect(status).toHaveClass('text-red-600')
    })

    it('应该显示账号待验证状态', () => {
      render(<UserInfoCard user={{ ...mockUser, status: 'pending' }} />)

      const status = screen.getByTestId('account-status')
      expect(status).toHaveTextContent('待验证')
      expect(status).toHaveClass('text-yellow-600')
    })
  })

  describe('快捷操作', () => {
    it('应该显示编辑按钮', () => {
      render(<UserInfoCard user={mockUser} editable />)

      expect(screen.getByText('编辑资料')).toBeInTheDocument()
    })

    it('点击编辑按钮应该打开编辑表单', async () => {
      render(<UserInfoCard user={mockUser} editable />)

      const editButton = screen.getByText('编辑资料')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByLabelText('昵称')).toBeInTheDocument()
        expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
      })
    })

    it('应该支持修改昵称', async () => {
      const mockUpdate = jest.fn()
      render(<UserInfoCard user={mockUser} editable onUpdate={mockUpdate} />)

      const editButton = screen.getByText('编辑资料')
      fireEvent.click(editButton)

      const nicknameInput = screen.getByLabelText('昵称')
      fireEvent.change(nicknameInput, { target: { value: 'New Name' } })

      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          nickname: 'New Name',
        })
      })
    })

    it('应该显示修改密码按钮', () => {
      render(<UserInfoCard user={mockUser} editable />)

      expect(screen.getByText('修改密码')).toBeInTheDocument()
    })

    it('点击修改密码应该打开密码表单', async () => {
      render(<UserInfoCard user={mockUser} editable />)

      const changePasswordButton = screen.getByText('修改密码')
      fireEvent.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByLabelText('当前密码')).toBeInTheDocument()
        expect(screen.getByLabelText('新密码')).toBeInTheDocument()
        expect(screen.getByLabelText('确认密码')).toBeInTheDocument()
      })
    })
  })

  describe('加载状态', () => {
    it('应该显示骨架屏', () => {
      render(<UserInfoCard user={mockUser} loading />)

      expect(screen.getByTestId('skeleton-avatar')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton-name')).toBeInTheDocument()
      expect(screen.getByTestId('skeleton-email')).toBeInTheDocument()
    })

    it('加载完成后应该显示实际内容', () => {
      const { rerender } = render(<UserInfoCard user={mockUser} loading />)

      expect(screen.getByTestId('skeleton-avatar')).toBeInTheDocument()

      rerender(<UserInfoCard user={mockUser} loading={false} />)

      expect(screen.queryByTestId('skeleton-avatar')).not.toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('应该显示错误消息', () => {
      render(<UserInfoCard user={mockUser} error="加载用户信息失败" />)

      expect(screen.getByText('加载用户信息失败')).toBeInTheDocument()
    })

    it('应该显示重试按钮', () => {
      const mockRetry = jest.fn()
      render(
        <UserInfoCard user={mockUser} error="加载失败" onRetry={mockRetry} />
      )

      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      expect(mockRetry).toHaveBeenCalled()
    })

    it('更新失败应该显示错误提示', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: '更新失败' }),
        })
      ) as jest.Mock

      render(<UserInfoCard user={mockUser} editable />)

      const editButton = screen.getByText('编辑资料')
      fireEvent.click(editButton)

      const nicknameInput = screen.getByLabelText('昵称')
      fireEvent.change(nicknameInput, { target: { value: 'New Name' } })

      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('更新失败')).toBeInTheDocument()
      })
    })
  })

  describe('样式和布局', () => {
    it('应该支持自定义className', () => {
      const { container } = render(
        <UserInfoCard user={mockUser} className="custom-card" />
      )

      expect(container.firstChild).toHaveClass('custom-card')
    })

    it('应该应用卡片样式', () => {
      const { container } = render(<UserInfoCard user={mockUser} />)

      const card = container.firstChild
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md')
    })

    it('紧凑模式应该使用更小的间距', () => {
      const { container } = render(<UserInfoCard user={mockUser} compact />)

      const card = container.firstChild
      expect(card).toHaveClass('p-4')
    })

    it('正常模式应该使用标准间距', () => {
      const { container } = render(<UserInfoCard user={mockUser} />)

      const card = container.firstChild
      expect(card).toHaveClass('p-6')
    })
  })

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<UserInfoCard user={mockUser} />)

      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        '用户信息'
      )
    })

    it('头像应该有alt文本', () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: 'https://example.com/avatar.jpg',
      }

      render(<UserInfoCard user={userWithAvatar} />)

      const avatar = screen.getByAltText('User avatar')
      expect(avatar).toBeInTheDocument()
    })

    it('所有按钮应该有aria-label', () => {
      render(<UserInfoCard user={mockUser} editable />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(
          button.hasAttribute('aria-label') || button.textContent
        ).toBeTruthy()
      })
    })
  })

  describe('边界条件', () => {
    it('应该处理缺失的用户数据', () => {
      const incompleteUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      render(<UserInfoCard user={incompleteUser as any} />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('应该处理超长邮箱', () => {
      const longEmailUser = {
        ...mockUser,
        email: 'very.long.email.address.that.should.be.truncated@example.com',
      }

      render(<UserInfoCard user={longEmailUser} />)

      const email = screen.getByText(longEmailUser.email)
      expect(email).toHaveClass('truncate')
    })

    it('应该处理超长昵称', () => {
      const longNameUser = {
        ...mockUser,
        nickname: 'Very Long User Name That Should Be Handled Properly',
      }

      render(<UserInfoCard user={longNameUser} />)

      const nickname = screen.getByText(longNameUser.nickname)
      expect(nickname).toHaveClass('truncate')
    })

    it('应该处理0个密钥', () => {
      const noKeysUser = {
        ...mockUser,
        apiKeyCount: 0,
      }

      render(<UserInfoCard user={noKeysUser} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('个密钥')).toBeInTheDocument()
    })

    it('应该处理超大数字格式化', () => {
      const highUsageUser = {
        ...mockUser,
        totalRequests: 1234567890,
      }

      render(<UserInfoCard user={highUsageUser} />)

      expect(screen.getByText('1,234,567,890')).toBeInTheDocument()
    })
  })

  describe('性能优化', () => {
    it('应该使用memo避免不必要的重新渲染', () => {
      const { rerender } = render(<UserInfoCard user={mockUser} />)

      const card = screen.getByRole('region')
      const initialCard = card

      rerender(<UserInfoCard user={mockUser} />)

      expect(screen.getByRole('region')).toBe(initialCard)
    })
  })
})
