/**
 * ExpirationTab 组件测试
 * Sprint 14 - Phase 2 🔴 RED
 *
 * 测试到期提醒设置标签页组件：
 * - 提醒天数配置
 * - 提醒渠道选择
 * - 设置保存
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpirationTab } from '@/components/settings/ExpirationTab'
import type { ExpirationSettings } from '@/types/settings'

// Mock React Query
const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const { useQuery, useMutation } = require('@tanstack/react-query')

describe('ExpirationTab', () => {
  const mockSettings: ExpirationSettings = {
    id: 'settings-123',
    userId: 'user-123',
    reminderDays: [7, 3, 1],
    notifyChannels: ['email', 'system'],
    enabled: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-06T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.mockClear()
    mockInvalidateQueries.mockClear()

    // Mock settings query
    useQuery.mockReturnValue({
      data: mockSettings,
      isPending: false,
      isError: false,
    })

    // Mock mutation
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
  })

  describe('数据加载', () => {
    it('加载时应该显示骨架屏', () => {
      useQuery.mockReturnValue({
        data: null,
        isPending: true,
      })

      render(<ExpirationTab />)

      expect(screen.getByTestId('expiration-skeleton')).toBeInTheDocument()
    })

    it('加载成功应该显示设置', () => {
      render(<ExpirationTab />)

      expect(screen.getByText(/提前提醒天数/)).toBeInTheDocument()
      expect(screen.getByText(/提醒方式/)).toBeInTheDocument()
    })
  })

  describe('提醒天数设置', () => {
    it('应该显示当前提醒天数', () => {
      render(<ExpirationTab />)

      expect(screen.getByDisplayValue('7')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    })

    it('应该验证天数范围（1-30）', async () => {
      const user = userEvent.setup()
      render(<ExpirationTab />)

      const dayInput = screen.getAllByRole('spinbutton')[0]

      // 输入无效值（0）
      await user.clear(dayInput)
      await user.type(dayInput, '0')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/天数必须在1-30之间/)).toBeInTheDocument()
      })

      // 输入无效值（31）
      await user.clear(dayInput)
      await user.type(dayInput, '31')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/天数必须在1-30之间/)).toBeInTheDocument()
      })
    })

    it('应该支持添加新的提醒天数', async () => {
      const user = userEvent.setup()
      render(<ExpirationTab />)

      const addButton = screen.getByRole('button', { name: /添加提醒天数/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
      })
    })

    it('应该支持删除提醒天数', async () => {
      const user = userEvent.setup()
      render(<ExpirationTab />)

      const deleteButtons = screen.getAllByRole('button', { name: /删除/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
      })
    })
  })

  describe('提醒渠道设置', () => {
    it('应该显示所有提醒渠道选项', () => {
      render(<ExpirationTab />)

      expect(screen.getByLabelText(/邮件提醒/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Webhook提醒/)).toBeInTheDocument()
      expect(screen.getByLabelText(/系统提醒/)).toBeInTheDocument()
    })

    it('应该显示当前选中的渠道', () => {
      render(<ExpirationTab />)

      expect(screen.getByLabelText(/邮件提醒/)).toBeChecked()
      expect(screen.getByLabelText(/Webhook提醒/)).not.toBeChecked()
      expect(screen.getByLabelText(/系统提醒/)).toBeChecked()
    })
  })

  describe('设置保存', () => {
    it('保存成功应该显示提示', async () => {
      const mockMutate = jest.fn()

      // Mock mutation返回配置对象
      useMutation.mockImplementation((config) => {
        return {
          mutate: (data) => {
            mockMutate(data)
            // 立即调用onSuccess
            config.onSuccess?.()
          },
          isPending: false,
        }
      })

      const user = userEvent.setup()
      render(<ExpirationTab />)

      const saveButton = screen.getByRole('button', { name: /保存设置/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({ title: '保存成功' })
      })
    })
  })
})
