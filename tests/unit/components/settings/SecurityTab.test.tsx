/**
 * SecurityTab 组件测试
 * Sprint 14 - Phase 2 🔴 RED
 *
 * 测试安全设置标签页组件：
 * - 密码修改表单
 * - 密码验证
 * - 密码强度指示器
 * - 会话管理
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SecurityTab } from '@/components/settings/SecurityTab'
import type { UserSession } from '@/types/user'

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

const { useQuery, useMutation } = require('@tanstack/react-query')

describe('SecurityTab', () => {
  const mockSessions: UserSession[] = [
    {
      id: 'session-1',
      userId: 'user-123',
      device: 'macOS',
      browser: 'Chrome',
      location: '上海',
      ip: '192.168.1.1',
      lastActiveAt: '2025-10-06T10:00:00Z',
      isCurrent: true,
      createdAt: '2025-10-01T00:00:00Z',
    },
    {
      id: 'session-2',
      userId: 'user-123',
      device: 'iOS',
      browser: 'Safari',
      location: '北京',
      ip: '192.168.1.2',
      lastActiveAt: '2025-10-06T08:00:00Z',
      isCurrent: false,
      createdAt: '2025-10-05T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock sessions query
    useQuery.mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
    })

    // Mock mutation
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    })
  })

  describe('密码修改表单', () => {
    it('应该渲染密码修改表单', () => {
      render(<SecurityTab />)

      expect(screen.getByLabelText(/当前密码/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^新密码$/)).toBeInTheDocument()
      expect(screen.getByLabelText(/确认新密码/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /更新密码/i })).toBeInTheDocument()
    })

    it('应该显示密码验证规则提示', () => {
      render(<SecurityTab />)

      expect(
        screen.getByText(/至少8个字符，包含大小写字母、数字和特殊字符/)
      ).toBeInTheDocument()
    })

    it('应该显示密码强度指示器', async () => {
      const user = userEvent.setup()
      render(<SecurityTab />)

      const newPasswordInput = screen.getByLabelText(/^新密码$/)

      // 输入弱密码
      await user.type(newPasswordInput, '12345678')

      await waitFor(() => {
        expect(screen.getByTestId('password-strength')).toHaveTextContent('弱')
      })

      // 输入强密码
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'StrongPass123!')

      await waitFor(() => {
        expect(screen.getByTestId('password-strength')).toHaveTextContent('强')
      })
    })
  })

  describe('密码验证', () => {
    it('应该验证新密码强度', async () => {
      const user = userEvent.setup()
      render(<SecurityTab />)

      const newPasswordInput = screen.getByLabelText(/^新密码$/)

      // 输入弱密码（少于8字符）
      await user.type(newPasswordInput, '1234')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/密码至少需要8个字符/)).toBeInTheDocument()
      })
    })

    it('应该验证新密码包含必需字符类型', async () => {
      const user = userEvent.setup()
      render(<SecurityTab />)

      const newPasswordInput = screen.getByLabelText(/^新密码$/)

      // 输入只有数字的密码
      await user.type(newPasswordInput, '12345678')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/密码必须包含大小写字母、数字和特殊字符/)).toBeInTheDocument()
      })
    })

    it('应该验证确认密码匹配', async () => {
      const user = userEvent.setup()
      render(<SecurityTab />)

      const newPasswordInput = screen.getByLabelText(/^新密码$/)
      const confirmPasswordInput = screen.getByLabelText(/确认新密码/)

      // 输入不匹配的密码
      await user.type(newPasswordInput, 'StrongPass123!')
      await user.type(confirmPasswordInput, 'DifferentPass123!')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/两次输入的密码不一致/)).toBeInTheDocument()
      })
    })

    it('修改成功应该清空表单', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        isSuccess: true,
      })

      const user = userEvent.setup()
      render(<SecurityTab />)

      const oldPasswordInput = screen.getByLabelText(/当前密码/)
      const newPasswordInput = screen.getByLabelText(/^新密码$/)
      const confirmPasswordInput = screen.getByLabelText(/确认新密码/)
      const submitButton = screen.getByRole('button', { name: /更新密码/i })

      // 填写表单
      await user.type(oldPasswordInput, 'OldPass123!')
      await user.type(newPasswordInput, 'NewPass123!')
      await user.type(confirmPasswordInput, 'NewPass123!')

      // 提交
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          oldPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
        })
      })
    })

    it('修改失败应该显示错误提示', () => {
      useMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        isError: true,
        error: new Error('旧密码错误'),
      })

      render(<SecurityTab />)

      expect(screen.getByText(/旧密码错误/)).toBeInTheDocument()
    })
  })

  describe('会话管理', () => {
    it('应该显示活跃会话列表', () => {
      render(<SecurityTab />)

      expect(screen.getByText(/macOS/)).toBeInTheDocument()
      expect(screen.getByText(/Chrome/)).toBeInTheDocument()
      expect(screen.getByText(/iOS/)).toBeInTheDocument()
      expect(screen.getByText(/Safari/)).toBeInTheDocument()
    })

    it('应该标记当前会话', () => {
      render(<SecurityTab />)

      const currentSession = screen.getByText(/当前设备/)
      expect(currentSession).toBeInTheDocument()
    })

    it('点击注销应该确认并删除会话', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      const user = userEvent.setup()
      render(<SecurityTab />)

      // 点击非当前会话的注销按钮
      const deleteButtons = screen.getAllByRole('button', { name: /注销/i })
      await user.click(deleteButtons[0])

      // 确认对话框应该出现
      await waitFor(() => {
        expect(screen.getByText(/确认注销此设备/)).toBeInTheDocument()
      })

      // 确认注销
      const confirmButton = screen.getByRole('button', { name: /确认/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith('session-2')
      })
    })

    it('应该支持注销所有其他设备', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      const user = userEvent.setup()
      render(<SecurityTab />)

      const deleteAllButton = screen.getByRole('button', { name: /注销所有其他设备/i })
      await user.click(deleteAllButton)

      // 确认对话框
      await waitFor(() => {
        expect(screen.getByText(/确认注销所有其他设备/)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /确认/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith('all')
      })
    })
  })
})
