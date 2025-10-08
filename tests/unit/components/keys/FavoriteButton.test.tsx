/**
 * FavoriteButton 组件测试
 * P1 阶段 - 收藏功能 🔴 RED
 *
 * 测试收藏按钮组件:
 * - 按钮渲染和状态显示
 * - 收藏/取消收藏交互
 * - API 调用和响应处理
 * - 加载状态和错误处理
 * - 无障碍支持
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoriteButton } from '@/components/keys/FavoriteButton'

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

import { toast } from '@/components/ui/use-toast'
const mockToast = toast as jest.MockedFunction<typeof toast>

// Mock fetch
global.fetch = jest.fn()

describe('FavoriteButton', () => {
  const mockOnToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockToast.mockClear()
  })

  describe('按钮渲染', () => {
    it('应该渲染收藏按钮容器', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      expect(screen.getByTestId('favorite-button')).toBeInTheDocument()
    })

    it('未收藏状态应该显示空心星星图标', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      const icon = button.querySelector('svg')
      expect(icon).toHaveClass('lucide-star') // 空心星星
      expect(icon).not.toHaveClass('fill-yellow-400') // 未填充
    })

    it('已收藏状态应该显示实心星星图标', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={true} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      const icon = button.querySelector('svg')
      expect(icon).toHaveClass('lucide-star')
      expect(icon).toHaveClass('fill-yellow-400') // 已填充
    })

    it('应该有正确的 aria-label', () => {
      const { rerender } = render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      expect(screen.getByLabelText('收藏')).toBeInTheDocument()

      rerender(
        <FavoriteButton keyId="key-1" isFavorite={true} onToggle={mockOnToggle} />
      )

      expect(screen.getByLabelText('取消收藏')).toBeInTheDocument()
    })
  })

  describe('用户交互', () => {
    it('点击按钮应该调用 API 并更新状态', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, isFavorite: true }),
      })

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys/key-1/favorite',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFavorite: true }),
          })
        )
      })

      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })

    it('取消收藏应该调用 API 并更新状态', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, isFavorite: false }),
      })

      render(
        <FavoriteButton keyId="key-1" isFavorite={true} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys/key-1/favorite',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ isFavorite: false }),
          })
        )
      })

      expect(mockOnToggle).toHaveBeenCalledWith(false)
    })

    it('连续快速点击应该只发送一次请求', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')

      // 快速点击三次
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('加载状态', () => {
    it('API 请求期间应该显示加载状态', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      // 请求期间按钮应该禁用
      expect(button).toBeDisabled()

      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('加载期间应该显示 spinner', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('API 返回错误应该显示提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '服务器错误' }),
      })

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '操作失败，请重试',
          variant: 'destructive',
        })
      })

      // 状态不应该改变
      expect(mockOnToggle).not.toHaveBeenCalled()
    })

    it('网络错误应该显示友好提示', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '操作失败，请重试',
          variant: 'destructive',
        })
      })
    })

    it('错误后应该恢复原始状态', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      const initialIcon = button.querySelector('svg')?.className

      await userEvent.click(button)

      await waitFor(() => {
        const currentIcon = button.querySelector('svg')?.className
        expect(currentIcon).toBe(initialIcon) // 图标恢复原样
      })
    })
  })

  describe('无障碍支持', () => {
    it('按钮应该可以通过键盘操作', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      button.focus()

      expect(button).toHaveFocus()

      fireEvent.keyPress(button, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('应该有正确的 role 属性', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('状态变化应该通过 aria-pressed 反映', () => {
      const { rerender } = render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      expect(screen.getByTestId('favorite-button')).toHaveAttribute(
        'aria-pressed',
        'false'
      )

      rerender(
        <FavoriteButton keyId="key-1" isFavorite={true} onToggle={mockOnToggle} />
      )

      expect(screen.getByTestId('favorite-button')).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
  })

  describe('样式和视觉反馈', () => {
    it('hover 状态应该有视觉反馈', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')

      expect(button).toHaveClass('hover:bg-gray-100')
    })

    it('收藏状态的按钮应该有特殊样式', () => {
      render(
        <FavoriteButton keyId="key-1" isFavorite={true} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      const icon = button.querySelector('svg')

      expect(icon).toHaveClass('text-yellow-500')
    })

    it('禁用状态应该有视觉指示', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // 永不 resolve，保持 loading
      )

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')
      await userEvent.click(button)

      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('性能优化', () => {
    it('应该使用防抖避免频繁请求', async () => {
      jest.useFakeTimers()

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <FavoriteButton keyId="key-1" isFavorite={false} onToggle={mockOnToggle} />
      )

      const button = screen.getByTestId('favorite-button')

      // 快速点击多次
      await userEvent.click(button)
      jest.advanceTimersByTime(100)
      await userEvent.click(button)
      jest.advanceTimersByTime(100)
      await userEvent.click(button)

      // 只应该发送最后一次请求
      expect(global.fetch).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })
  })
})
