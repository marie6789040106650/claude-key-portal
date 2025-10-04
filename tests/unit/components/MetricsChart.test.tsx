/**
 * MetricsChart 组件测试
 *
 * 测试性能指标图表组件:
 * - 图表数据渲染
 * - 指标类型切换
 * - 空数据状态
 * - 加载状态
 * - 时间范围过滤
 * - 响应式图表
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MetricsChart } from '@/components/monitor/MetricsChart'
import { MetricType } from '@prisma/client'

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('MetricsChart', () => {
  const mockData = [
    {
      timestamp: '2025-10-04T10:00:00Z',
      value: 100,
      name: '/api/keys',
    },
    {
      timestamp: '2025-10-04T10:05:00Z',
      value: 120,
      name: '/api/keys',
    },
    {
      timestamp: '2025-10-04T10:10:00Z',
      value: 110,
      name: '/api/keys',
    },
  ]

  describe('图表数据渲染', () => {
    it('应该渲染图表组件', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('line')).toBeInTheDocument()
    })

    it('应该渲染坐标轴', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('grid')).toBeInTheDocument()
    })

    it('应该渲染工具提示和图例', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('指标类型切换', () => {
    it('应该显示响应时间标题', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByText('Response Time')).toBeInTheDocument()
    })

    it('应该显示QPS标题', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.QPS}
        />
      )

      expect(screen.getByText('QPS (Queries Per Second)')).toBeInTheDocument()
    })

    it('应该显示内存使用标题', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.MEMORY_USAGE}
        />
      )

      expect(screen.getByText('Memory Usage')).toBeInTheDocument()
    })

    it('应该切换指标类型', async () => {
      const { rerender } = render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByText('Response Time')).toBeInTheDocument()

      rerender(
        <MetricsChart
          data={mockData}
          metricType={MetricType.QPS}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('QPS (Queries Per Second)')).toBeInTheDocument()
      })
    })
  })

  describe('空数据状态', () => {
    it('应该显示空数据提示', () => {
      render(
        <MetricsChart
          data={[]}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('应该显示自定义空数据消息', () => {
      render(
        <MetricsChart
          data={[]}
          metricType={MetricType.RESPONSE_TIME}
          emptyMessage="No metrics data for this time range"
        />
      )

      expect(screen.getByText('No metrics data for this time range')).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载中状态', () => {
      render(
        <MetricsChart
          data={[]}
          metricType={MetricType.RESPONSE_TIME}
          loading={true}
        />
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument()
    })

    it('加载中时应该隐藏图表', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          loading={true}
        />
      )

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })
  })

  describe('时间范围过滤', () => {
    it('应该显示时间范围选择器', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          showTimeRange={true}
        />
      )

      expect(screen.getByText('1H')).toBeInTheDocument()
      expect(screen.getByText('6H')).toBeInTheDocument()
      expect(screen.getByText('24H')).toBeInTheDocument()
      expect(screen.getByText('7D')).toBeInTheDocument()
    })

    it('应该切换时间范围', async () => {
      const onTimeRangeChange = jest.fn()
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          showTimeRange={true}
          onTimeRangeChange={onTimeRangeChange}
        />
      )

      fireEvent.click(screen.getByText('6H'))

      await waitFor(() => {
        expect(onTimeRangeChange).toHaveBeenCalledWith('6H')
      })
    })

    it('应该高亮显示当前时间范围', () => {
      const { container } = render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          showTimeRange={true}
          timeRange="24H"
        />
      )

      const button24H = screen.getByText('24H').closest('button')
      expect(button24H).toHaveClass('bg-blue-500', 'text-white')
    })
  })

  describe('数据转换', () => {
    it('应该正确转换时间戳格式', () => {
      const { container } = render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      // 验证X轴显示的是格式化后的时间
      expect(container).toHaveTextContent('10:00')
      expect(container).toHaveTextContent('10:05')
      expect(container).toHaveTextContent('10:10')
    })

    it('应该格式化Y轴数值（内存）', () => {
      const memoryData = [
        { timestamp: '2025-10-04T10:00:00Z', value: 150_000_000 },
        { timestamp: '2025-10-04T10:05:00Z', value: 160_000_000 },
      ]

      const { container } = render(
        <MetricsChart
          data={memoryData}
          metricType={MetricType.MEMORY_USAGE}
        />
      )

      // 应该显示MB格式
      expect(container).toHaveTextContent('150 MB')
      expect(container).toHaveTextContent('160 MB')
    })
  })

  describe('图表交互', () => {
    it('应该支持Tooltip hover', async () => {
      const { container } = render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      const chart = screen.getByTestId('line-chart')
      fireEvent.mouseMove(chart, { clientX: 100, clientY: 100 })

      await waitFor(() => {
        expect(screen.getByTestId('tooltip')).toBeVisible()
      })
    })

    it('应该支持缩放功能', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          enableZoom={true}
        />
      )

      expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument()
      expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument()
      expect(screen.getByTestId('reset-zoom-button')).toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    it('应该使用ResponsiveContainer', () => {
      render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      const container = screen.getByTestId('responsive-container')
      expect(container).toBeInTheDocument()
    })

    it('应该根据容器大小调整图表高度', () => {
      const { rerender } = render(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          height={300}
        />
      )

      let container = screen.getByTestId('responsive-container')
      expect(container).toHaveStyle({ height: '300px' })

      rerender(
        <MetricsChart
          data={mockData}
          metricType={MetricType.RESPONSE_TIME}
          height={500}
        />
      )

      container = screen.getByTestId('responsive-container')
      expect(container).toHaveStyle({ height: '500px' })
    })
  })

  describe('边界条件', () => {
    it('应该处理单个数据点', () => {
      const singleData = [
        { timestamp: '2025-10-04T10:00:00Z', value: 100 },
      ]

      render(
        <MetricsChart
          data={singleData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('应该处理超大数据集', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        value: Math.random() * 1000,
      }))

      render(
        <MetricsChart
          data={largeData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('应该处理负数值', () => {
      const negativeData = [
        { timestamp: '2025-10-04T10:00:00Z', value: -50 },
        { timestamp: '2025-10-04T10:05:00Z', value: -30 },
      ]

      render(
        <MetricsChart
          data={negativeData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('应该处理缺失的timestamp字段', () => {
      const invalidData = [
        { value: 100 },
        { value: 120 },
      ] as any

      render(
        <MetricsChart
          data={invalidData}
          metricType={MetricType.RESPONSE_TIME}
        />
      )

      expect(screen.getByText('Invalid data format')).toBeInTheDocument()
    })
  })
})
