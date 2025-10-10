/**
 * 密钥详情页面测试
 * 测试 /app/dashboard/keys/[id]/page.tsx
 *
 * TDD阶段: 🔴 RED
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import KeyDetailPage from '@/app/dashboard/keys/[id]/page'
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('KeyDetailPage', () => {
  let queryClient: QueryClient
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  const mockKeyData = {
    id: 'key-123',
    name: 'Test API Key',
    crsKey: 'sk-ant-api03...abc12345',
    status: 'ACTIVE',
    description: 'Test key description',
    tags: ['production', 'test'],
    notes: 'Some notes about this key',
    isFavorite: true,
    monthlyUsage: 1500,
    totalCalls: 5000,
    totalTokens: 250000,
    createdAt: '2025-01-01T00:00:00.000Z',
    lastUsedAt: '2025-01-10T12:00:00.000Z',
    updatedAt: '2025-01-10T12:00:00.000Z',
  }

  const renderComponent = (params = { id: 'key-123' }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KeyDetailPage params={params} />
      </QueryClientProvider>
    )
  }

  describe('🧪 加载状态', () => {
    it('应该显示加载骨架屏', () => {
      ;(fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // 永不resolve，保持加载状态
      )

      renderComponent()

      expect(screen.getByTestId('key-detail-skeleton')).toBeInTheDocument()
    })
  })

  describe('🧪 数据加载成功', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockKeyData,
      })
    })

    it('应该显示密钥基本信息', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Test API Key')).toBeInTheDocument()
      })

      // 状态标签
      expect(screen.getByText('ACTIVE')).toBeInTheDocument()

      // 描述
      expect(screen.getByText('Test key description')).toBeInTheDocument()

      // 创建时间
      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })

    it('应该显示标签信息', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('production')).toBeInTheDocument()
      })

      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('应该显示收藏状态图标', async () => {
      renderComponent()

      await waitFor(() => {
        const favoriteIcon = screen.getByTestId('favorite-icon')
        expect(favoriteIcon).toBeInTheDocument()
        expect(favoriteIcon).toHaveClass('text-yellow-500') // 已收藏
      })
    })

    it('应该显示使用统计概览', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument() // totalCalls
      })

      expect(screen.getByText('250,000')).toBeInTheDocument() // totalTokens
      expect(screen.getByText('1,500')).toBeInTheDocument() // monthlyUsage
    })

    it('应该显示备注信息', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Some notes about this key')).toBeInTheDocument()
      })
    })

    it('应该显示脱敏的密钥值', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/sk-ant-api03/)).toBeInTheDocument()
        expect(screen.getByText(/abc12345/)).toBeInTheDocument()
      })
    })
  })

  describe('🧪 操作按钮', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockKeyData,
      })
    })

    it('应该显示返回按钮', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument()
      })
    })

    it('应该显示编辑按钮', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId('edit-button')).toBeInTheDocument()
      })
    })

    it('应该显示删除按钮', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId('delete-button')).toBeInTheDocument()
      })
    })

    it('应该显示刷新按钮', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument()
      })
    })
  })

  describe('🧪 错误处理', () => {
    it('应该显示404错误信息', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: '密钥不存在' }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/密钥不存在/)).toBeInTheDocument()
      })
    })

    it('应该显示权限错误信息', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: '无权访问此密钥' }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/无权访问/)).toBeInTheDocument()
      })
    })

    it('应该显示通用错误信息和重试按钮', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/加载失败/)).toBeInTheDocument()
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })
    })
  })

  describe('🧪 状态展示', () => {
    it('应该正确显示ACTIVE状态', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, status: 'ACTIVE' }),
      })

      renderComponent()

      await waitFor(() => {
        const badge = screen.getByText('ACTIVE')
        expect(badge).toHaveClass('bg-green-100')
      })
    })

    it('应该正确显示INACTIVE状态', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, status: 'INACTIVE' }),
      })

      renderComponent()

      await waitFor(() => {
        const badge = screen.getByText('INACTIVE')
        expect(badge).toHaveClass('bg-gray-100')
      })
    })

    it('应该正确显示PAUSED状态', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, status: 'PAUSED' }),
      })

      renderComponent()

      await waitFor(() => {
        const badge = screen.getByText('PAUSED')
        expect(badge).toHaveClass('bg-yellow-100')
      })
    })
  })

  describe('🧪 空数据处理', () => {
    it('应该处理没有标签的情况', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, tags: [] }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('暂无标签')).toBeInTheDocument()
      })
    })

    it('应该处理没有备注的情况', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, notes: null }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('暂无备注')).toBeInTheDocument()
      })
    })

    it('应该处理没有描述的情况', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, description: null }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('暂无描述')).toBeInTheDocument()
      })
    })

    it('应该处理从未使用的情况', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockKeyData, lastUsedAt: null }),
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('从未使用')).toBeInTheDocument()
      })
    })
  })

  describe('🧪 响应式布局', () => {
    it('应该在移动端正确显示', async () => {
      global.innerWidth = 375
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockKeyData,
      })

      renderComponent()

      await waitFor(() => {
        const container = screen.getByTestId('key-detail-container')
        expect(container).toHaveClass('container')
      })
    })
  })
})
