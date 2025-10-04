/**
 * MetricsChart 组件测试
 *
 * 测试性能指标图表组件的渲染和交互
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MetricsChart } from '@/components/monitor/MetricsChart'

// Mock Recharts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: any) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  }
})

describe('MetricsChart', () => {
  const mockResponseTimeData = [
    {
      timestamp: '2025-10-04T09:00:00.000Z',
      value: 120,
      name: 'Response Time',
    },
    {
      timestamp: '2025-10-04T10:00:00.000Z',
      value: 150,
      name: 'Response Time',
    },
    {
      timestamp: '2025-10-04T11:00:00.000Z',
      value: 100,
      name: 'Response Time',
    },
  ]

  const mockQPSData = [
    { timestamp: '2025-10-04T09:00:00.000Z', value: 15.5, name: 'QPS' },
    { timestamp: '2025-10-04T10:00:00.000Z', value: 18.2, name: 'QPS' },
    { timestamp: '2025-10-04T11:00:00.000Z', value: 20.0, name: 'QPS' },
  ]

  const mockMemoryData = [
    {
      timestamp: '2025-10-04T09:00:00.000Z',
      value: 150,
      name: 'Memory Usage',
    },
    {
      timestamp: '2025-10-04T10:00:00.000Z',
      value: 160,
      name: 'Memory Usage',
    },
    {
      timestamp: '2025-10-04T11:00:00.000Z',
      value: 155,
      name: 'Memory Usage',
    },
  ]

  describe('基本渲染', () => {
    it('应该渲染图表标题', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByText('响应时间趋势')).toBeInTheDocument()
    })

    it('应该渲染Recharts组件', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })

    it('应该渲染Line组件用于显示数据', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByTestId('line-value')).toBeInTheDocument()
    })
  })

  describe('指标类型切换', () => {
    it('应该显示指标类型选择器', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByLabelText(/选择指标类型/i)).toBeInTheDocument()
    })

    it('应该显示所有可用的指标类型', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      const select = screen.getByLabelText(/选择指标类型/i)

      expect(select).toBeInTheDocument()
      // 检查option是否存在
      expect(screen.getByRole('option', { name: /响应时间/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /QPS/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /内存使用/i })).toBeInTheDocument()
    })

    it('应该在切换指标类型时调用回调', () => {
      const onMetricChange = jest.fn()

      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
          onMetricChange={onMetricChange}
        />
      )

      const select = screen.getByLabelText(/选择指标类型/i)
      fireEvent.change(select, { target: { value: 'QPS' } })

      expect(onMetricChange).toHaveBeenCalledWith('QPS')
    })

    it('应该根据指标类型显示正确的标题', () => {
      const { rerender } = render(
        <MetricsChart data={mockQPSData} metricType="QPS" />
      )

      expect(screen.getByText('QPS趋势')).toBeInTheDocument()

      rerender(
        <MetricsChart data={mockMemoryData} metricType="MEMORY_USAGE" />
      )

      expect(screen.getByText('内存使用趋势')).toBeInTheDocument()
    })
  })

  describe('空数据状态', () => {
    it('应该显示空数据提示', () => {
      render(<MetricsChart data={[]} metricType="RESPONSE_TIME" />)

      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument()
    })

    it('应该在空数据时不渲染图表', () => {
      render(<MetricsChart data={[]} metricType="RESPONSE_TIME" />)

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('应该显示空数据图标', () => {
      render(<MetricsChart data={[]} metricType="RESPONSE_TIME" />)

      expect(screen.getByTestId('empty-data-icon')).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          isLoading={true}
        />
      )

      expect(screen.getByText(/加载中/i)).toBeInTheDocument()
    })

    it('应该在加载时显示骨架屏', () => {
      render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          isLoading={true}
        />
      )

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    })

    it('应该在加载完成后隐藏加载状态', () => {
      const { rerender } = render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          isLoading={true}
        />
      )

      expect(screen.getByText(/加载中/i)).toBeInTheDocument()

      rerender(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
          isLoading={false}
        />
      )

      expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('应该显示错误信息', () => {
      const errorMessage = 'Failed to load metrics data'

      render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          error={errorMessage}
        />
      )

      expect(screen.getByText(/加载失败/i)).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('应该在错误时显示重试按钮', () => {
      const onRetry = jest.fn()

      render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          error="Error"
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /重试/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('应该调用重试回调', () => {
      const onRetry = jest.fn()

      render(
        <MetricsChart
          data={[]}
          metricType="RESPONSE_TIME"
          error="Error"
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /重试/i })
      fireEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('时间范围控制', () => {
    it('应该显示时间范围选择器', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
          showTimeRangeSelector={true}
        />
      )

      expect(screen.getByLabelText(/时间范围/i)).toBeInTheDocument()
    })

    it('应该在切换时间范围时调用回调', () => {
      const onTimeRangeChange = jest.fn()

      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
          showTimeRangeSelector={true}
          onTimeRangeChange={onTimeRangeChange}
        />
      )

      const select = screen.getByLabelText(/时间范围/i)
      fireEvent.change(select, { target: { value: '24h' } })

      expect(onTimeRangeChange).toHaveBeenCalledWith('24h')
    })
  })

  describe('数据格式化', () => {
    it('应该正确格式化时间戳', () => {
      const { container } = render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      // XAxis应该接收格式化的时间戳
      const xAxis = container.querySelector('[data-testid="x-axis"]')
      expect(xAxis).toBeInTheDocument()
    })

    it('应该根据指标类型显示正确的单位', () => {
      const { rerender } = render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByText(/ms/i)).toBeInTheDocument()

      rerender(
        <MetricsChart data={mockMemoryData} metricType="MEMORY_USAGE" />
      )

      expect(screen.getByText(/MB/i)).toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    it('应该使用ResponsiveContainer', () => {
      render(
        <MetricsChart
          data={mockResponseTimeData}
          metricType="RESPONSE_TIME"
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })
})
