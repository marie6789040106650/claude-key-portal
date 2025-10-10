/**
 * Stats Page - Toast Error Handling Tests
 * 测试Stats页面的Toast错误提示
 *
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import UsageStatsPage from '@/app/dashboard/stats/page'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}))

// Mock useUsageStats
jest.mock('@/hooks/use-stats', () => ({
  useUsageStats: jest.fn(),
}))

describe('Stats Page - Toast Error Handling', () => {
  let queryClient: QueryClient
  let mockToast: jest.Mock

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    mockToast = jest.fn()
    ;(useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('🔴 RED: 数据加载失败时显示Toast', () => {
    it('网络错误时显示Toast提示', async () => {
      const { useUsageStats } = require('@/hooks/use-stats')
      useUsageStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 验证显示错误提示（当前是静态错误卡片）
      expect(screen.getByText('加载失败，请稍后重试')).toBeInTheDocument()

      // 🔴 RED: 期望显示Toast（现在会失败）
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '加载失败',
          description: '无法获取统计数据，请稍后重试',
          variant: 'destructive',
        })
      })
    })

    it('API错误时显示Toast提示', async () => {
      const { useUsageStats } = require('@/hooks/use-stats')
      useUsageStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch usage stats'),
        refetch: jest.fn(),
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 🔴 RED: 期望显示Toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '加载失败',
          description: '无法获取统计数据，请稍后重试',
          variant: 'destructive',
        })
      })
    })
  })

  describe('🔴 RED: 刷新失败时显示Toast', () => {
    it('手动刷新失败时显示Toast', async () => {
      const mockRefetch = jest.fn().mockRejectedValue(new Error('Refresh failed'))
      const { useUsageStats } = require('@/hooks/use-stats')

      useUsageStats.mockReturnValue({
        data: {
          summary: {
            totalTokens: 1000,
            totalRequests: 100,
            averageTokensPerRequest: 10,
            keyCount: 5,
          },
          keys: [],
          trend: [],
        },
        isLoading: false,
        error: undefined,
        refetch: mockRefetch,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 点击刷新按钮
      const refreshButton = screen.getByText('刷新')
      refreshButton.click()

      // 🔴 RED: 期望刷新失败时显示Toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '刷新失败',
          description: '无法刷新统计数据，请稍后重试',
          variant: 'destructive',
        })
      })
    })
  })

  describe('🔴 RED: CRS重试失败时显示Toast', () => {
    it('CRS重试失败时显示Toast', async () => {
      const mockRefetch = jest.fn().mockRejectedValue(new Error('CRS unavailable'))
      const { useUsageStats } = require('@/hooks/use-stats')

      useUsageStats.mockReturnValue({
        data: {
          summary: {
            totalTokens: 1000,
            totalRequests: 100,
            averageTokensPerRequest: 10,
            keyCount: 5,
          },
          keys: [],
          trend: [],
          crsWarning: 'CRS服务暂时不可用',
        },
        isLoading: false,
        error: undefined,
        refetch: mockRefetch,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // CRS状态Alert应该可见
      expect(screen.getByTestId('crs-status-alert')).toBeInTheDocument()

      // 点击CRS重试按钮
      const retryButton = screen.getByTestId('retry-crs-button')
      retryButton.click()

      // 🔴 RED: 期望CRS重试失败时显示Toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'CRS重试失败',
          description: 'CRS服务仍然不可用，已显示本地数据',
          variant: 'destructive',
        })
      })
    })
  })

  describe('🔴 RED: 成功操作时显示Toast', () => {
    it('刷新成功时显示Toast', async () => {
      const mockRefetch = jest.fn().mockResolvedValue({
        data: {
          summary: { totalTokens: 2000, totalRequests: 200, averageTokensPerRequest: 10, keyCount: 5 },
          keys: [],
          trend: [],
        },
      })
      const { useUsageStats } = require('@/hooks/use-stats')

      useUsageStats.mockReturnValue({
        data: {
          summary: {
            totalTokens: 1000,
            totalRequests: 100,
            averageTokensPerRequest: 10,
            keyCount: 5,
          },
          keys: [],
          trend: [],
        },
        isLoading: false,
        error: undefined,
        refetch: mockRefetch,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 点击刷新按钮
      const refreshButton = screen.getByText('刷新')
      refreshButton.click()

      // 🔴 RED: 期望刷新成功时显示Toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '刷新成功',
          description: '统计数据已更新',
        })
      })
    })

    it('CRS重试成功时显示Toast', async () => {
      const mockRefetch = jest.fn().mockResolvedValue({
        data: {
          summary: { totalTokens: 2000, totalRequests: 200, averageTokensPerRequest: 10, keyCount: 5 },
          keys: [],
          trend: [],
          crsWarning: undefined, // 重试成功，警告消失
        },
      })
      const { useUsageStats } = require('@/hooks/use-stats')

      useUsageStats.mockReturnValue({
        data: {
          summary: {
            totalTokens: 1000,
            totalRequests: 100,
            averageTokensPerRequest: 10,
            keyCount: 5,
          },
          keys: [],
          trend: [],
          crsWarning: 'CRS服务暂时不可用',
        },
        isLoading: false,
        error: undefined,
        refetch: mockRefetch,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 点击CRS重试按钮
      const retryButton = screen.getByTestId('retry-crs-button')
      retryButton.click()

      // 🔴 RED: 期望CRS重试成功时显示Toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'CRS连接成功',
          description: 'CRS服务已恢复，显示完整数据',
        })
      })
    })
  })

  describe('🔴 RED: 不应该移除错误卡片', () => {
    it('显示Toast不影响错误卡片的显示', async () => {
      const { useUsageStats } = require('@/hooks/use-stats')
      useUsageStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(
        <QueryClientProvider client={queryClient}>
          <UsageStatsPage />
        </QueryClientProvider>
      )

      // 🔴 RED: 错误卡片应该仍然存在
      expect(screen.getByText('加载失败，请稍后重试')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })
  })
})
