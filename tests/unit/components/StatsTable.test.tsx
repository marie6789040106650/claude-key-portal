/**
 * StatsTable 组件测试
 *
 * 测试统计表格组件
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { StatsTable } from '@/components/stats/StatsTable'
import type { KeyStats } from '@/types/stats'

describe('StatsTable', () => {
  const mockKeys: KeyStats[] = [
    {
      id: '1',
      name: 'Production Key',
      status: 'ACTIVE',
      totalTokens: 50000,
      totalRequests: 2500,
      monthlyUsage: 25000,
      createdAt: '2025-01-01T00:00:00Z',
      lastUsedAt: '2025-10-04T00:00:00Z',
    },
    {
      id: '2',
      name: 'Development Key',
      status: 'ACTIVE',
      totalTokens: 30000,
      totalRequests: 1500,
      monthlyUsage: 15000,
      createdAt: '2025-02-01T00:00:00Z',
      lastUsedAt: '2025-10-03T00:00:00Z',
    },
    {
      id: '3',
      name: 'Test Key',
      status: 'PAUSED',
      totalTokens: 10000,
      totalRequests: 500,
      monthlyUsage: 5000,
      createdAt: '2025-03-01T00:00:00Z',
      lastUsedAt: null,
    },
  ]

  const mockHandlers = {
    onViewDetails: jest.fn(),
    onSort: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('表格渲染', () => {
    it('应该渲染表格', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)
      expect(screen.getByTestId('stats-table')).toBeInTheDocument()
    })

    it('应该渲染表头', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByText('密钥名称')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
      expect(screen.getByText('请求数')).toBeInTheDocument()
      expect(screen.getByText('Token 数')).toBeInTheDocument()
      expect(screen.getByText('最后使用')).toBeInTheDocument()
      expect(screen.getByText('操作')).toBeInTheDocument()
    })

    it('应该渲染所有密钥行', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByText('Production Key')).toBeInTheDocument()
      expect(screen.getByText('Development Key')).toBeInTheDocument()
      expect(screen.getByText('Test Key')).toBeInTheDocument()
    })

    it('应该正确格式化数字', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      // 应该有千位分隔符
      expect(screen.getByText('50,000')).toBeInTheDocument()
      expect(screen.getByText('2,500')).toBeInTheDocument()
    })

    it('应该显示状态徽章', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const activebadges = screen.getAllByText('ACTIVE')
      const pausedBadges = screen.getAllByText('PAUSED')

      expect(activebadges).toHaveLength(2)
      expect(pausedBadges).toHaveLength(1)
    })

    it('应该格式化最后使用时间', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      // 应该显示相对时间或格式化的日期
      expect(screen.getByText(/2025-10-04/)).toBeInTheDocument()
      expect(screen.getByText(/从未使用/)).toBeInTheDocument()
    })
  })

  describe('排序功能', () => {
    it('点击表头应该触发排序', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const nameHeader = screen.getByText('密钥名称')
      fireEvent.click(nameHeader)

      expect(mockHandlers.onSort).toHaveBeenCalledWith('name', 'asc')
    })

    it('再次点击应该反转排序顺序', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          sortField="name"
          sortOrder="asc"
        />
      )

      const nameHeader = screen.getByText('密钥名称')
      fireEvent.click(nameHeader)

      expect(mockHandlers.onSort).toHaveBeenCalledWith('name', 'desc')
    })

    it('应该显示排序指示器', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          sortField="totalRequests"
          sortOrder="desc"
        />
      )

      const requestsHeader = screen.getByText('请求数')
      const headerCell = requestsHeader.closest('th')

      expect(within(headerCell!).getByTestId('sort-icon-desc')).toBeInTheDocument()
    })

    it('应该支持按请求数排序', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const requestsHeader = screen.getByText('请求数')
      fireEvent.click(requestsHeader)

      expect(mockHandlers.onSort).toHaveBeenCalledWith('totalRequests', 'asc')
    })

    it('应该支持按 Token 数排序', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const tokensHeader = screen.getByText('Token 数')
      fireEvent.click(tokensHeader)

      expect(mockHandlers.onSort).toHaveBeenCalledWith('totalTokens', 'asc')
    })
  })

  describe('分页功能', () => {
    it('应该显示分页控件', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
        />
      )

      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    it('应该显示当前页信息', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
          currentPage={1}
        />
      )

      expect(screen.getByText(/第 1 页/)).toBeInTheDocument()
      expect(screen.getByText(/共 5 页/)).toBeInTheDocument()
    })

    it('点击下一页应该触发回调', () => {
      const onPageChange = jest.fn()

      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
          currentPage={1}
          onPageChange={onPageChange}
        />
      )

      const nextButton = screen.getByTestId('next-page-button')
      fireEvent.click(nextButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('点击上一页应该触发回调', () => {
      const onPageChange = jest.fn()

      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
          currentPage={2}
          onPageChange={onPageChange}
        />
      )

      const prevButton = screen.getByTestId('prev-page-button')
      fireEvent.click(prevButton)

      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('第一页应该禁用上一页按钮', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
          currentPage={1}
        />
      )

      const prevButton = screen.getByTestId('prev-page-button')
      expect(prevButton).toBeDisabled()
    })

    it('最后一页应该禁用下一页按钮', () => {
      render(
        <StatsTable
          keys={mockKeys}
          {...mockHandlers}
          pageSize={2}
          total={10}
          currentPage={5}
        />
      )

      const nextButton = screen.getByTestId('next-page-button')
      expect(nextButton).toBeDisabled()
    })
  })

  describe('操作按钮', () => {
    it('应该显示查看详情按钮', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const detailButtons = screen.getAllByTestId(/view-details-button/)
      expect(detailButtons).toHaveLength(3)
    })

    it('点击查看详情应该触发回调', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      const firstDetailButton = screen.getByTestId('view-details-button-1')
      fireEvent.click(firstDetailButton)

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('1')
    })
  })

  describe('空状态', () => {
    it('空数据应该显示空状态提示', () => {
      render(<StatsTable keys={[]} {...mockHandlers} />)

      expect(screen.getByText(/暂无统计数据/)).toBeInTheDocument()
    })

    it('空状态应该显示提示图标', () => {
      render(<StatsTable keys={[]} {...mockHandlers} />)

      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('loading=true 应该显示骨架屏', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} loading />)

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
    })

    it('loading 时不应该显示表格内容', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} loading />)

      expect(screen.queryByText('Production Key')).not.toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    it('小屏幕应该切换到卡片视图', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByTestId('card-view')).toBeInTheDocument()
    })

    it('大屏幕应该显示表格视图', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      render(<StatsTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByTestId('table-view')).toBeInTheDocument()
    })
  })

  describe('高亮功能', () => {
    it('应该高亮最活跃的密钥', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} highlightTop />)

      const productionKeyRow = screen.getByText('Production Key').closest('tr')
      expect(productionKeyRow).toHaveClass('highlight')
    })

    it('应该显示排名徽章', () => {
      render(<StatsTable keys={mockKeys} {...mockHandlers} showRank />)

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
      expect(screen.getByText('#3')).toBeInTheDocument()
    })
  })
})
