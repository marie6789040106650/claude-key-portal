/**
 * Usage Stats Page 测试
 *
 * 测试统计页面的所有功能
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsageStatsPage from '@/app/dashboard/stats/page'

// Mock fetch
global.fetch = jest.fn()

describe('UsageStatsPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    jest.clearAllMocks()
  })

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <UsageStatsPage />
      </QueryClientProvider>
    )
  }

  describe('页面加载和数据获取', () => {
    it('应该显示页面标题', () => {
      renderPage()
      expect(screen.getByText('使用统计')).toBeInTheDocument()
    })

    it('加载时应该显示骨架屏', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // 永不resolve
      )

      renderPage()
      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()
    })

    it('加载成功应该显示统计数据', async () => {
      const mockData = {
        summary: {
          totalTokens: 100000,
          totalRequests: 5000,
          averageTokensPerRequest: 20,
          keyCount: 5,
        },
        keys: [
          {
            id: '1',
            name: 'Test Key 1',
            status: 'ACTIVE',
            totalTokens: 50000,
            totalRequests: 2500,
            monthlyUsage: 25000,
            createdAt: '2025-01-01T00:00:00Z',
            lastUsedAt: '2025-10-04T00:00:00Z',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('100,000')).toBeInTheDocument() // totalTokens
        expect(screen.getByText('5,000')).toBeInTheDocument() // totalRequests
      })
    })

    it('加载失败应该显示错误提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/加载失败/)).toBeInTheDocument()
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })
    })

    it('点击重试按钮应该重新加载数据', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })

      const mockData = {
        summary: {
          totalTokens: 100000,
          totalRequests: 5000,
          averageTokensPerRequest: 20,
          keyCount: 5,
        },
        keys: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      fireEvent.click(screen.getByTestId('retry-button'))

      await waitFor(() => {
        expect(screen.getByText('100,000')).toBeInTheDocument()
      })
    })
  })

  describe('时间范围选择', () => {
    it('应该显示时间范围选择器', () => {
      renderPage()
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
    })

    it('选择时间范围应该刷新数据', async () => {
      const mockData = {
        summary: {
          totalTokens: 100000,
          totalRequests: 5000,
          averageTokensPerRequest: 20,
          keyCount: 5,
        },
        keys: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
      })

      // 选择"最近7天"
      const dateRangePicker = screen.getByTestId('date-range-picker')
      fireEvent.change(dateRangePicker, { target: { value: 'last7days' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate='),
          expect.any(Object)
        )
      })
    })

    it('应该支持自定义时间范围', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('custom-date-range')).toBeInTheDocument()
      })

      const startDateInput = screen.getByTestId('start-date-input')
      const endDateInput = screen.getByTestId('end-date-input')

      fireEvent.change(startDateInput, { target: { value: '2025-10-01' } })
      fireEvent.change(endDateInput, { target: { value: '2025-10-04' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2025-10-01'),
          expect.any(Object)
        )
      })
    })
  })

  describe('密钥筛选', () => {
    it('应该显示密钥筛选器', async () => {
      const mockData = {
        summary: { totalTokens: 0, totalRequests: 0, averageTokensPerRequest: 0, keyCount: 0 },
        keys: [
          { id: '1', name: 'Key 1', status: 'ACTIVE', totalTokens: 100, totalRequests: 10, monthlyUsage: 50, createdAt: '2025-01-01', lastUsedAt: null },
          { id: '2', name: 'Key 2', status: 'ACTIVE', totalTokens: 200, totalRequests: 20, monthlyUsage: 100, createdAt: '2025-01-01', lastUsedAt: null },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('key-filter')).toBeInTheDocument()
      })
    })

    it('选择密钥应该过滤数据', async () => {
      const allKeysData = {
        summary: { totalTokens: 300, totalRequests: 30, averageTokensPerRequest: 10, keyCount: 2 },
        keys: [
          { id: '1', name: 'Key 1', status: 'ACTIVE', totalTokens: 100, totalRequests: 10, monthlyUsage: 50, createdAt: '2025-01-01', lastUsedAt: null },
          { id: '2', name: 'Key 2', status: 'ACTIVE', totalTokens: 200, totalRequests: 20, monthlyUsage: 100, createdAt: '2025-01-01', lastUsedAt: null },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => allKeysData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('key-filter')).toBeInTheDocument()
      })

      // 选择Key 1
      const keyCheckbox = screen.getByTestId('key-checkbox-1')
      fireEvent.click(keyCheckbox)

      await waitFor(() => {
        // 应该只显示Key 1的数据
        expect(screen.getByText('100')).toBeInTheDocument()
      })
    })

    it('应该支持全选/取消全选', async () => {
      const mockData = {
        summary: { totalTokens: 0, totalRequests: 0, averageTokensPerRequest: 0, keyCount: 0 },
        keys: [
          { id: '1', name: 'Key 1', status: 'ACTIVE', totalTokens: 100, totalRequests: 10, monthlyUsage: 50, createdAt: '2025-01-01', lastUsedAt: null },
          { id: '2', name: 'Key 2', status: 'ACTIVE', totalTokens: 200, totalRequests: 20, monthlyUsage: 100, createdAt: '2025-01-01', lastUsedAt: null },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('select-all-keys')).toBeInTheDocument()
      })

      const selectAllCheckbox = screen.getByTestId('select-all-keys')

      // 全选
      fireEvent.click(selectAllCheckbox)
      expect(screen.getByTestId('key-checkbox-1')).toBeChecked()
      expect(screen.getByTestId('key-checkbox-2')).toBeChecked()

      // 取消全选
      fireEvent.click(selectAllCheckbox)
      expect(screen.getByTestId('key-checkbox-1')).not.toBeChecked()
      expect(screen.getByTestId('key-checkbox-2')).not.toBeChecked()
    })
  })

  describe('图表渲染', () => {
    it('应该渲染时间趋势图表', async () => {
      const mockData = {
        summary: { totalTokens: 100, totalRequests: 10, averageTokensPerRequest: 10, keyCount: 1 },
        keys: [
          { id: '1', name: 'Key 1', status: 'ACTIVE', totalTokens: 100, totalRequests: 10, monthlyUsage: 50, createdAt: '2025-01-01', lastUsedAt: '2025-10-04' },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('stats-chart')).toBeInTheDocument()
      })
    })

    it('空数据应该显示空状态提示', async () => {
      const mockData = {
        summary: { totalTokens: 0, totalRequests: 0, averageTokensPerRequest: 0, keyCount: 0 },
        keys: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/暂无数据/)).toBeInTheDocument()
      })
    })
  })

  describe('导出功能', () => {
    it('应该显示导出按钮', () => {
      renderPage()
      expect(screen.getByTestId('export-button')).toBeInTheDocument()
    })

    it('点击导出按钮应该导出CSV', async () => {
      const mockData = {
        summary: { totalTokens: 100, totalRequests: 10, averageTokensPerRequest: 10, keyCount: 1 },
        keys: [
          { id: '1', name: 'Key 1', status: 'ACTIVE', totalTokens: 100, totalRequests: 10, monthlyUsage: 50, createdAt: '2025-01-01', lastUsedAt: null },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')

      // Mock document.createElement
      const mockLink = {
        click: jest.fn(),
        href: '',
        download: '',
      }
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('export-button'))

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockLink.download).toContain('.csv')
      })
    })

    it('导出空数据应该显示提示', async () => {
      const mockData = {
        summary: { totalTokens: 0, totalRequests: 0, averageTokensPerRequest: 0, keyCount: 0 },
        keys: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('export-button'))

      await waitFor(() => {
        expect(screen.getByText(/暂无数据可导出/)).toBeInTheDocument()
      })
    })
  })
})
