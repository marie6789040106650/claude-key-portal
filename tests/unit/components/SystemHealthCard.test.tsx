/**
 * SystemHealthCard 组件测试
 *
 * 测试系统健康状态卡片组件:
 * - 健康状态渲染
 * - 降级状态渲染
 * - 不健康状态渲染
 * - 响应时间显示
 * - 加载状态
 * - 错误状态
 */

import { render, screen } from '@testing-library/react'
import { SystemHealthCard } from '@/components/monitor/SystemHealthCard'

describe('SystemHealthCard', () => {
  describe('健康状态渲染', () => {
    it('应该渲染健康状态', () => {
      render(
        <SystemHealthCard
          service="Database"
          status="healthy"
          responseTime={50}
        />
      )

      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByText('50ms')).toBeInTheDocument()
    })

    it('应该显示绿色指示器', () => {
      const { container } = render(
        <SystemHealthCard
          service="Redis"
          status="healthy"
          responseTime={30}
        />
      )

      const indicator = container.querySelector('[data-testid="status-indicator"]')
      expect(indicator).toHaveClass('bg-green-500')
    })
  })

  describe('降级状态渲染', () => {
    it('应该渲染降级状态', () => {
      render(
        <SystemHealthCard
          service="CRS"
          status="degraded"
          responseTime={500}
        />
      )

      expect(screen.getByText('CRS')).toBeInTheDocument()
      expect(screen.getByText('Degraded')).toBeInTheDocument()
      expect(screen.getByText('500ms')).toBeInTheDocument()
    })

    it('应该显示黄色指示器', () => {
      const { container } = render(
        <SystemHealthCard
          service="CRS"
          status="degraded"
          responseTime={500}
        />
      )

      const indicator = container.querySelector('[data-testid="status-indicator"]')
      expect(indicator).toHaveClass('bg-yellow-500')
    })
  })

  describe('不健康状态渲染', () => {
    it('应该渲染不健康状态', () => {
      render(
        <SystemHealthCard
          service="Database"
          status="unhealthy"
          responseTime={0}
          error="Connection timeout"
        />
      )

      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Unhealthy')).toBeInTheDocument()
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('应该显示红色指示器', () => {
      const { container } = render(
        <SystemHealthCard
          service="Database"
          status="unhealthy"
          responseTime={0}
          error="Connection failed"
        />
      )

      const indicator = container.querySelector('[data-testid="status-indicator"]')
      expect(indicator).toHaveClass('bg-red-500')
    })

    it('应该隐藏响应时间（错误时）', () => {
      render(
        <SystemHealthCard
          service="Redis"
          status="unhealthy"
          responseTime={0}
          error="Redis unavailable"
        />
      )

      expect(screen.queryByText('0ms')).not.toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载中状态', () => {
      render(
        <SystemHealthCard
          service="Database"
          status="healthy"
          responseTime={0}
          loading={true}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('加载中时应该禁用交互', () => {
      const { container } = render(
        <SystemHealthCard
          service="Database"
          status="healthy"
          responseTime={0}
          loading={true}
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('opacity-50', 'pointer-events-none')
    })
  })

  describe('响应时间格式化', () => {
    it('应该显示毫秒格式（<1000ms）', () => {
      render(
        <SystemHealthCard
          service="Redis"
          status="healthy"
          responseTime={150}
        />
      )

      expect(screen.getByText('150ms')).toBeInTheDocument()
    })

    it('应该显示秒格式（>=1000ms）', () => {
      render(
        <SystemHealthCard
          service="CRS"
          status="degraded"
          responseTime={1500}
        />
      )

      expect(screen.getByText('1.5s')).toBeInTheDocument()
    })

    it('应该显示分钟格式（>=60000ms）', () => {
      render(
        <SystemHealthCard
          service="Database"
          status="degraded"
          responseTime={75000}
        />
      )

      expect(screen.getByText('1.25m')).toBeInTheDocument()
    })
  })

  describe('可选属性', () => {
    it('应该支持自定义className', () => {
      const { container } = render(
        <SystemHealthCard
          service="Database"
          status="healthy"
          responseTime={50}
          className="custom-card"
        />
      )

      expect(container.firstChild).toHaveClass('custom-card')
    })

    it('应该支持lastChecked时间戳', () => {
      const lastChecked = new Date('2025-10-04T10:00:00Z')
      render(
        <SystemHealthCard
          service="Database"
          status="healthy"
          responseTime={50}
          lastChecked={lastChecked}
        />
      )

      expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
    })
  })

  describe('边界条件', () => {
    it('应该处理0毫秒响应时间', () => {
      render(
        <SystemHealthCard
          service="Redis"
          status="healthy"
          responseTime={0}
        />
      )

      expect(screen.getByText('0ms')).toBeInTheDocument()
    })

    it('应该处理超大响应时间', () => {
      render(
        <SystemHealthCard
          service="Database"
          status="unhealthy"
          responseTime={999999}
        />
      )

      expect(screen.getByText('16.67m')).toBeInTheDocument()
    })

    it('应该处理缺失error属性（unhealthy状态）', () => {
      render(
        <SystemHealthCard
          service="CRS"
          status="unhealthy"
          responseTime={0}
        />
      )

      expect(screen.getByText('Service unavailable')).toBeInTheDocument()
    })
  })
})
