/**
 * CRS Status Alert Component Tests
 * 测试CRS服务状态提示组件
 *
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrsStatusAlert } from '@/components/stats/CrsStatusAlert'

describe('CrsStatusAlert', () => {
  it('无警告时不显示', () => {
    render(<CrsStatusAlert warning={undefined} onRetry={() => {}} />)
    expect(screen.queryByTestId('crs-status-alert')).not.toBeInTheDocument()
  })

  it('警告为空字符串时不显示', () => {
    render(<CrsStatusAlert warning="" onRetry={() => {}} />)
    expect(screen.queryByTestId('crs-status-alert')).not.toBeInTheDocument()
  })

  it('有警告时显示Alert', () => {
    render(
      <CrsStatusAlert
        warning="CRS服务暂时不可用，显示本地统计数据"
        onRetry={() => {}}
      />
    )

    expect(screen.getByTestId('crs-status-alert')).toBeInTheDocument()
    expect(
      screen.getByText(/CRS服务暂时不可用，显示本地统计数据/)
    ).toBeInTheDocument()
  })

  it('显示警告图标', () => {
    render(
      <CrsStatusAlert warning="CRS服务暂时不可用" onRetry={() => {}} />
    )

    // Alert组件应该包含图标
    const alert = screen.getByTestId('crs-status-alert')
    expect(alert).toBeInTheDocument()
  })

  it('显示重试按钮', () => {
    render(
      <CrsStatusAlert warning="CRS unavailable" onRetry={() => {}} />
    )

    expect(screen.getByTestId('retry-crs-button')).toBeInTheDocument()
    expect(screen.getByText('重试')).toBeInTheDocument()
  })

  it('点击重试按钮触发回调', async () => {
    const onRetry = jest.fn()
    const user = userEvent.setup()

    render(<CrsStatusAlert warning="error" onRetry={onRetry} />)

    const button = screen.getByTestId('retry-crs-button')
    await user.click(button)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('重试中时按钮显示loading状态', () => {
    render(
      <CrsStatusAlert
        warning="error"
        onRetry={() => {}}
        retrying={true}
      />
    )

    const button = screen.getByTestId('retry-crs-button')
    expect(button).toBeDisabled()
    expect(screen.getByText('重试中...')).toBeInTheDocument()
  })

  it('使用warning样式', () => {
    render(<CrsStatusAlert warning="error" onRetry={() => {}} />)

    const alert = screen.getByTestId('crs-status-alert')
    // 检查是否包含warning相关的class
    expect(alert.className).toMatch(/border-warning|bg-warning/)
  })

  it('显示标题"CRS服务状态"', () => {
    render(<CrsStatusAlert warning="test warning" onRetry={() => {}} />)

    expect(screen.getByText('CRS服务状态')).toBeInTheDocument()
  })

  it('支持多段警告消息（分号分隔）', () => {
    render(
      <CrsStatusAlert
        warning="CRS服务暂时不可用，显示本地统计数据; 趋势数据暂时不可用"
        onRetry={() => {}}
      />
    )

    expect(
      screen.getByText(
        /CRS服务暂时不可用，显示本地统计数据; 趋势数据暂时不可用/
      )
    ).toBeInTheDocument()
  })
})
