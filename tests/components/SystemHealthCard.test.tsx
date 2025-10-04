/**
 * SystemHealthCard 组件测试
 *
 * 测试系统健康状态卡片组件的渲染和交互
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SystemHealthCard } from '@/components/monitor/SystemHealthCard'
import { SystemHealthCheck } from '@/lib/services/health-check-service'

describe('SystemHealthCard', () => {
  const mockHealthyData: SystemHealthCheck = {
    overall: 'healthy',
    services: {
      database: {
        status: 'healthy',
        responseTime: 50,
      },
      redis: {
        status: 'healthy',
        responseTime: 10,
      },
      crs: {
        status: 'healthy',
        responseTime: 120,
      },
    },
    timestamp: '2025-10-04T10:00:00.000Z',
  }

  const mockDegradedData: SystemHealthCheck = {
    overall: 'degraded',
    services: {
      database: {
        status: 'healthy',
        responseTime: 50,
      },
      redis: {
        status: 'unhealthy',
        responseTime: 5000,
        error: 'Connection timeout',
      },
      crs: {
        status: 'healthy',
        responseTime: 120,
      },
    },
    timestamp: '2025-10-04T10:00:00.000Z',
  }

  const mockUnhealthyData: SystemHealthCheck = {
    overall: 'unhealthy',
    services: {
      database: {
        status: 'unhealthy',
        responseTime: 5000,
        error: 'Connection refused',
      },
      redis: {
        status: 'unhealthy',
        responseTime: 5000,
        error: 'Connection timeout',
      },
      crs: {
        status: 'unhealthy',
        responseTime: 5000,
        error: 'Service unavailable',
      },
    },
    timestamp: '2025-10-04T10:00:00.000Z',
  }

  describe('渲染健康状态', () => {
    it('应该渲染健康状态标题', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('系统健康状态')).toBeInTheDocument()
    })

    it('应该显示整体健康状态为healthy', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('正常')).toBeInTheDocument()
      expect(screen.getByTestId('status-indicator-healthy')).toBeInTheDocument()
    })

    it('应该显示整体健康状态为degraded', () => {
      render(<SystemHealthCard data={mockDegradedData} />)

      expect(screen.getByText('降级')).toBeInTheDocument()
      expect(
        screen.getByTestId('status-indicator-degraded')
      ).toBeInTheDocument()
    })

    it('应该显示整体健康状态为unhealthy', () => {
      render(<SystemHealthCard data={mockUnhealthyData} />)

      expect(screen.getByText('异常')).toBeInTheDocument()
      expect(
        screen.getByTestId('status-indicator-unhealthy')
      ).toBeInTheDocument()
    })
  })

  describe('渲染服务状态', () => {
    it('应该显示所有服务的状态', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Redis')).toBeInTheDocument()
      expect(screen.getByText('CRS')).toBeInTheDocument()
    })

    it('应该显示每个服务的响应时间', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      expect(screen.getByText('50ms')).toBeInTheDocument() // Database
      expect(screen.getByText('10ms')).toBeInTheDocument() // Redis
      expect(screen.getByText('120ms')).toBeInTheDocument() // CRS
    })

    it('应该为健康的服务显示绿色图标', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      const healthyIcons = screen.getAllByTestId('service-status-healthy')
      expect(healthyIcons).toHaveLength(3)
    })

    it('应该为不健康的服务显示红色图标', () => {
      render(<SystemHealthCard data={mockUnhealthyData} />)

      const unhealthyIcons = screen.getAllByTestId('service-status-unhealthy')
      expect(unhealthyIcons).toHaveLength(3)
    })

    it('应该显示服务错误信息', () => {
      render(<SystemHealthCard data={mockDegradedData} />)

      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })
  })

  describe('加载和错误状态', () => {
    it('应该显示加载状态', () => {
      render(<SystemHealthCard isLoading={true} />)

      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('应该显示错误状态', () => {
      const errorMessage = 'Failed to fetch health data'
      render(<SystemHealthCard error={errorMessage} />)

      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('应该在错误状态显示重试按钮', () => {
      const onRetry = jest.fn()
      render(<SystemHealthCard error="Error" onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /重试/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('应该调用重试回调', () => {
      const onRetry = jest.fn()
      render(<SystemHealthCard error="Error" onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /重试/i })
      retryButton.click()

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('时间戳显示', () => {
    it('应该显示检查时间', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      // 应该包含时间信息
      expect(
        screen.getByText(/最后检查时间|Last checked/i)
      ).toBeInTheDocument()
    })

    it('应该格式化时间戳', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      // 时间应该被格式化显示（例如：10:00 AM）
      const timeElement = screen.getByTestId('check-timestamp')
      expect(timeElement).toBeInTheDocument()
      expect(timeElement.textContent).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('响应式设计', () => {
    it('应该有合适的容器类名用于响应式布局', () => {
      const { container } = render(<SystemHealthCard data={mockHealthyData} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('rounded')
      expect(card.className).toContain('border')
    })
  })

  describe('辅助功能(A11y)', () => {
    it('应该有合适的ARIA标签', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toBeInTheDocument()
    })

    it('应该为状态指示器提供aria-label', () => {
      render(<SystemHealthCard data={mockHealthyData} />)

      const indicator = screen.getByTestId('status-indicator-healthy')
      expect(indicator).toHaveAttribute('aria-label', '系统状态：正常')
    })
  })
})
