/**
 * SystemHealthCard 组件测试
 *
 * 测试系统健康状态卡片组件:
 * - 健康状态渲染
 * - 降级状态渲染
 * - 不健康状态渲染
 * - 服务状态显示
 * - 加载状态
 * - 错误状态
 */

import { render, screen } from '@testing-library/react'
import { SystemHealthCard } from '@/components/monitor/SystemHealthCard'
import type { SystemHealthCheck } from '@/lib/services/health-check-service'

// Mock date-fns 避免时间相关测试不稳定
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2分钟前'),
}))

describe('SystemHealthCard', () => {
  const mockHealthyData: SystemHealthCheck = {
    overall: 'healthy',
    services: {
      database: { status: 'healthy', responseTime: 50 },
      redis: { status: 'healthy', responseTime: 30 },
      crs: { status: 'healthy', responseTime: 100 },
    },
    timestamp: '2025-10-05T10:00:00Z',
  }

  const mockDegradedData: SystemHealthCheck = {
    overall: 'degraded',
    services: {
      database: { status: 'healthy', responseTime: 50 },
      redis: { status: 'healthy', responseTime: 30 },
      crs: { status: 'degraded', responseTime: 500 },
    },
    timestamp: '2025-10-05T10:00:00Z',
  }

  const mockUnhealthyData: SystemHealthCheck = {
    overall: 'unhealthy',
    services: {
      database: {
        status: 'unhealthy',
        responseTime: 0,
        error: 'Connection timeout',
      },
      redis: { status: 'healthy', responseTime: 30 },
      crs: { status: 'healthy', responseTime: 100 },
    },
    timestamp: '2025-10-05T10:00:00Z',
  }

  describe('健康状态渲染', () => {
    it('应该渲染系统健康状态', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('系统健康状态')).toBeInTheDocument()
      expect(screen.getByText('正常')).toBeInTheDocument()
    })

    it('应该渲染所有服务状态', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Redis')).toBeInTheDocument()
      expect(screen.getByText('CRS')).toBeInTheDocument()
    })

    it('应该显示服务响应时间', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('50ms')).toBeInTheDocument()
      expect(screen.getByText('30ms')).toBeInTheDocument()
      expect(screen.getByText('100ms')).toBeInTheDocument()
    })

    it('应该显示绿色状态指示器', () => {
      const { container } = render(<SystemHealthCard data={mockHealthyData} />)

      const indicator = container.querySelector('[data-testid="status-indicator-healthy"]')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('bg-green-100')
    })

    it('应该显示最后检查时间', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText(/最后检查时间:/)).toBeInTheDocument()
      expect(screen.getByTestId('check-timestamp')).toHaveTextContent('2分钟前')
    })
  })

  describe('降级状态渲染', () => {
    it('应该渲染降级状态', () => {
      render(<SystemHealthCard data={mockDegradedData} />)

      expect(screen.getByText('降级')).toBeInTheDocument()
    })

    it('应该显示黄色状态指示器', () => {
      const { container } = render(<SystemHealthCard data={mockDegradedData} />)

      const indicator = container.querySelector('[data-testid="status-indicator-degraded"]')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('bg-amber-100')
    })

    it('应该显示降级服务的响应时间', () => {
      render(<SystemHealthCard data={mockDegradedData} />)

      expect(screen.getByText('500ms')).toBeInTheDocument()
    })
  })

  describe('不健康状态渲染', () => {
    it('应该渲染不健康状态', () => {
      render(<SystemHealthCard data={mockUnhealthyData} />)

      expect(screen.getByText('异常')).toBeInTheDocument()
    })

    it('应该显示红色状态指示器', () => {
      const { container } = render(<SystemHealthCard data={mockUnhealthyData} />)

      const indicator = container.querySelector('[data-testid="status-indicator-unhealthy"]')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('bg-red-100')
    })

    it('应该显示服务错误信息', () => {
      render(<SystemHealthCard data={mockUnhealthyData} />)

      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('应该显示不健康服务的状态图标', () => {
      const { container } = render(<SystemHealthCard data={mockUnhealthyData} />)

      // 检查是否有错误状态的服务
      const errorService = container.querySelector('[data-testid="service-status-unhealthy"]')
      expect(errorService).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载中状态', () => {
      render(<SystemHealthCard isLoading={true} />)

      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('加载中时不应该显示健康数据', () => {
      render(<SystemHealthCard data={mockHealthyData} isLoading={true} />)

      expect(screen.queryByText('Database')).not.toBeInTheDocument()
      expect(screen.queryByText('正常')).not.toBeInTheDocument()
    })
  })

  describe('错误状态', () => {
    it('应该显示错误信息', () => {
      render(<SystemHealthCard error="Failed to fetch health status" />)

      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch health status')).toBeInTheDocument()
    })

    it('应该显示重试按钮', () => {
      const onRetry = jest.fn()
      render(<SystemHealthCard error="Network error" onRetry={onRetry} />)

      expect(screen.getByText('重试')).toBeInTheDocument()
    })

    it('错误时不应该显示健康数据', () => {
      render(<SystemHealthCard data={mockHealthyData} error="Error occurred" />)

      expect(screen.queryByText('Database')).not.toBeInTheDocument()
      expect(screen.queryByText('正常')).not.toBeInTheDocument()
    })

    it('没有onRetry时不应该显示重试按钮', () => {
      render(<SystemHealthCard error="Network error" />)

      expect(screen.queryByText('重试')).not.toBeInTheDocument()
    })
  })

  describe('空数据处理', () => {
    it('没有数据且无加载无错误时不应该渲染', () => {
      const { container } = render(<SystemHealthCard />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('可访问性', () => {
    it('状态指示器应该有正确的aria-label', () => {
      const { container } = render(<SystemHealthCard data={mockHealthyData} />)

      const indicator = container.querySelector('[role="status"]')
      expect(indicator).toHaveAttribute('aria-label', '系统状态：正常')
    })
  })
})
