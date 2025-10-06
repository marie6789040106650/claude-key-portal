/**
 * NotificationsTab 组件测试
 * Sprint 14 - Phase 2 🔴 RED
 *
 * 测试通知设置标签页组件：
 * - 通知开关渲染
 * - 通知类型配置
 * - 自动保存
 * - Webhook配置
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import type { NotificationConfig } from '@/types/settings'

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

// Mock Toast
const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const { useQuery, useMutation } = require('@tanstack/react-query')

describe('NotificationsTab', () => {
  const mockConfig: NotificationConfig = {
    id: 'config-123',
    userId: 'user-123',
    channels: {
      email: true,
      webhook: false,
      system: true,
    },
    types: {
      KEY_CREATED: true,
      KEY_DELETED: false,
      USAGE_WARNING: true,
      SECURITY_ALERT: true,
      SYSTEM_UPDATE: false,
    },
    webhookUrl: null,
    webhookSecret: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-06T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()

    // Mock config query
    useQuery.mockReturnValue({
      data: mockConfig,
      isLoading: false,
      isError: false,
    })

    // Mock mutation
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  })

  describe('数据加载', () => {
    it('加载时应该显示骨架屏', () => {
      useQuery.mockReturnValue({
        data: null,
        isLoading: true,
      })

      render(<NotificationsTab />)

      expect(screen.getByTestId('notifications-skeleton')).toBeInTheDocument()
    })

    it('加载成功应该显示配置', () => {
      render(<NotificationsTab />)

      expect(screen.getByText(/密钥创建通知/)).toBeInTheDocument()
      expect(screen.getByText(/使用量告警/)).toBeInTheDocument()
      expect(screen.getByText(/安全告警/)).toBeInTheDocument()
    })
  })

  describe('通知开关', () => {
    it('应该显示所有通知类型开关', () => {
      render(<NotificationsTab />)

      expect(screen.getByLabelText(/密钥创建通知/)).toBeInTheDocument()
      expect(screen.getByLabelText(/密钥删除通知/)).toBeInTheDocument()
      expect(screen.getByLabelText(/使用量告警/)).toBeInTheDocument()
      expect(screen.getByLabelText(/安全告警/)).toBeInTheDocument()
      expect(screen.getByLabelText(/产品更新通知/)).toBeInTheDocument()
    })

    it('应该显示正确的默认状态', () => {
      render(<NotificationsTab />)

      expect(screen.getByLabelText(/密钥创建通知/)).toBeChecked()
      expect(screen.getByLabelText(/密钥删除通知/)).not.toBeChecked()
      expect(screen.getByLabelText(/使用量告警/)).toBeChecked()
      expect(screen.getByLabelText(/安全告警/)).toBeChecked()
      expect(screen.getByLabelText(/产品更新通知/)).not.toBeChecked()
    })

    it('切换开关应该触发保存', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      const user = userEvent.setup()
      render(<NotificationsTab />)

      const keyDeletedSwitch = screen.getByLabelText(/密钥删除通知/)
      await user.click(keyDeletedSwitch)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          types: {
            KEY_DELETED: true,
          },
        })
      })
    })

    it('保存成功应该显示提示', async () => {
      useMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        isSuccess: true,
      })

      render(<NotificationsTab />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '保存成功',
        })
      })
    })

    it('保存失败应该恢复开关状态', async () => {
      let onErrorCallback: (() => void) | undefined

      useMutation.mockImplementation((options: any) => {
        onErrorCallback = options.onError
        return {
          mutate: jest.fn(),
          isLoading: false,
          isSuccess: false,
          isError: false,
        }
      })

      const user = userEvent.setup()
      const { rerender } = render(<NotificationsTab />)

      const keyCreatedSwitch = screen.getByLabelText(/密钥创建通知/)
      const initialState = keyCreatedSwitch.getAttribute('aria-checked') === 'true'

      // 切换开关
      await user.click(keyCreatedSwitch)

      // 手动触发 onError 回调
      await act(async () => {
        if (onErrorCallback) {
          onErrorCallback()
        }
      })

      // 重新渲染以显示错误状态
      useMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        isSuccess: false,
        isError: true,
      })
      rerender(<NotificationsTab />)

      // 失败后应该恢复原状态并显示错误提示
      await waitFor(() => {
        expect(keyCreatedSwitch.getAttribute('aria-checked') === 'true').toBe(initialState)
        expect(mockToast).toHaveBeenCalledWith({
          title: '保存失败',
          variant: 'destructive',
        })
      })
    })
  })

  describe('通知渠道', () => {
    it('应该显示通知渠道选项', () => {
      render(<NotificationsTab />)

      expect(screen.getByLabelText(/邮件通知/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Webhook通知/)).toBeInTheDocument()
      expect(screen.getByLabelText(/系统通知/)).toBeInTheDocument()
    })

    it('切换渠道应该触发保存', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      })

      const user = userEvent.setup()
      render(<NotificationsTab />)

      const webhookSwitch = screen.getByLabelText(/Webhook通知/)
      await user.click(webhookSwitch)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          channels: {
            webhook: true,
          },
        })
      })
    })
  })
})
