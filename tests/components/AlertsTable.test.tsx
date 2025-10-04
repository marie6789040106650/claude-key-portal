/**
 * AlertsTable 组件测试
 *
 * 测试告警列表组件的渲染、过滤、排序和分页功能
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AlertsTable } from '@/components/monitor/AlertsTable'
import { AlertStatus, AlertSeverity, MetricType } from '@prisma/client'

describe('AlertsTable', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      ruleId: 'rule-1',
      status: 'FIRING' as AlertStatus,
      message: 'High response time detected',
      value: 1500,
      triggeredAt: new Date('2025-10-04T10:00:00.000Z'),
      resolvedAt: null,
      rule: {
        name: 'High Response Time',
        severity: 'WARNING' as AlertSeverity,
        metric: 'RESPONSE_TIME' as MetricType,
      },
    },
    {
      id: 'alert-2',
      ruleId: 'rule-2',
      status: 'RESOLVED' as AlertStatus,
      message: 'Memory leak detected',
      value: 500,
      triggeredAt: new Date('2025-10-04T09:00:00.000Z'),
      resolvedAt: new Date('2025-10-04T09:30:00.000Z'),
      rule: {
        name: 'Memory Leak',
        severity: 'CRITICAL' as AlertSeverity,
        metric: 'MEMORY_USAGE' as MetricType,
      },
    },
    {
      id: 'alert-3',
      ruleId: 'rule-3',
      status: 'SILENCED' as AlertStatus,
      message: 'Low disk space',
      value: 95,
      triggeredAt: new Date('2025-10-04T08:00:00.000Z'),
      resolvedAt: null,
      rule: {
        name: 'Low Disk Space',
        severity: 'ERROR' as AlertSeverity,
        metric: 'CPU_USAGE' as MetricType,
      },
    },
  ]

  const mockPagination = {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  }

  describe('基本渲染', () => {
    it('应该渲染表格标题', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      expect(screen.getByText('告警ID')).toBeInTheDocument()
      expect(screen.getByText('规则名称')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
      expect(screen.getByText('严重程度')).toBeInTheDocument()
      expect(screen.getByText('触发时间')).toBeInTheDocument()
    })

    it('应该渲染所有告警记录', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      expect(screen.getByText('High Response Time')).toBeInTheDocument()
      expect(screen.getByText('Memory Leak')).toBeInTheDocument()
      expect(screen.getByText('Low Disk Space')).toBeInTheDocument()
    })

    it('应该显示告警消息', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      expect(
        screen.getByText('High response time detected')
      ).toBeInTheDocument()
      expect(screen.getByText('Memory leak detected')).toBeInTheDocument()
    })
  })

  describe('状态显示', () => {
    it('应该显示FIRING状态的徽章', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const firingBadge = screen.getByText('活跃')
      expect(firingBadge).toBeInTheDocument()
      expect(firingBadge.className).toContain('bg-red')
    })

    it('应该显示RESOLVED状态的徽章', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const resolvedBadge = screen.getByText('已解决')
      expect(resolvedBadge).toBeInTheDocument()
      expect(resolvedBadge.className).toContain('bg-green')
    })

    it('应该显示SILENCED状态的徽章', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const silencedBadge = screen.getByText('已静音')
      expect(silencedBadge).toBeInTheDocument()
      expect(silencedBadge.className).toContain('bg-gray')
    })
  })

  describe('严重程度显示', () => {
    it('应该为不同严重程度显示不同颜色', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const warningBadge = screen.getByTestId('severity-WARNING')
      const criticalBadge = screen.getByTestId('severity-CRITICAL')
      const errorBadge = screen.getByTestId('severity-ERROR')

      expect(warningBadge.className).toContain('bg-amber')
      expect(criticalBadge.className).toContain('bg-red')
      expect(errorBadge.className).toContain('bg-orange')
    })
  })

  describe('过滤功能', () => {
    it('应该显示过滤选择器', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      expect(screen.getByLabelText(/状态过滤/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/严重程度过滤/i)).toBeInTheDocument()
    })

    it('应该在改变状态过滤器时调用回调', () => {
      const onFilterChange = jest.fn()

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={mockPagination}
          onFilterChange={onFilterChange}
        />
      )

      const statusFilter = screen.getByLabelText(/状态过滤/i)
      fireEvent.change(statusFilter, { target: { value: 'FIRING' } })

      expect(onFilterChange).toHaveBeenCalledWith({
        status: 'FIRING',
        severity: null,
      })
    })

    it('应该在改变严重程度过滤器时调用回调', () => {
      const onFilterChange = jest.fn()

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={mockPagination}
          onFilterChange={onFilterChange}
        />
      )

      const severityFilter = screen.getByLabelText(/严重程度过滤/i)
      fireEvent.change(severityFilter, { target: { value: 'CRITICAL' } })

      expect(onFilterChange).toHaveBeenCalledWith({
        status: null,
        severity: 'CRITICAL',
      })
    })
  })

  describe('分页功能', () => {
    it('应该显示分页信息', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      expect(screen.getByText(/共 3 条记录/i)).toBeInTheDocument()
    })

    it('应该显示分页控件', () => {
      const paginationWithPages = {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      }

      render(
        <AlertsTable alerts={mockAlerts} pagination={paginationWithPages} />
      )

      expect(screen.getByRole('button', { name: /上一页/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /下一页/i })).toBeInTheDocument()
    })

    it('应该在第一页时禁用上一页按钮', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const prevButton = screen.getByRole('button', { name: /上一页/i })
      expect(prevButton).toBeDisabled()
    })

    it('应该在最后一页时禁用下一页按钮', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const nextButton = screen.getByRole('button', { name: /下一页/i })
      expect(nextButton).toBeDisabled()
    })

    it('应该在点击下一页时调用回调', () => {
      const onPageChange = jest.fn()
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      }

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /下一页/i })
      fireEvent.click(nextButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })
  })

  describe('排序功能', () => {
    it('应该显示可排序的列标题', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const timeHeader = screen.getByText('触发时间')
      expect(timeHeader.closest('th')).toHaveAttribute('role', 'button')
    })

    it('应该在点击列标题时调用排序回调', () => {
      const onSortChange = jest.fn()

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={mockPagination}
          onSortChange={onSortChange}
        />
      )

      const timeHeader = screen.getByText('触发时间')
      fireEvent.click(timeHeader)

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'triggeredAt',
        order: 'desc',
      })
    })

    it('应该切换排序顺序', () => {
      const onSortChange = jest.fn()

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={mockPagination}
          onSortChange={onSortChange}
          sortField="triggeredAt"
          sortOrder="desc"
        />
      )

      const timeHeader = screen.getByText('触发时间')
      fireEvent.click(timeHeader)

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'triggeredAt',
        order: 'asc',
      })
    })
  })

  describe('空数据状态', () => {
    it('应该显示空数据提示', () => {
      render(<AlertsTable alerts={[]} pagination={{ ...mockPagination, total: 0 }} />)

      expect(screen.getByText(/暂无告警记录/i)).toBeInTheDocument()
    })

    it('应该在空数据时不显示表格', () => {
      render(<AlertsTable alerts={[]} pagination={{ ...mockPagination, total: 0 }} />)

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(
        <AlertsTable
          alerts={[]}
          pagination={mockPagination}
          isLoading={true}
        />
      )

      expect(screen.getByText(/加载中/i)).toBeInTheDocument()
    })

    it('应该显示骨架屏', () => {
      render(
        <AlertsTable
          alerts={[]}
          pagination={mockPagination}
          isLoading={true}
        />
      )

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
    })
  })

  describe('时间格式化', () => {
    it('应该正确格式化触发时间', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      // 应该显示相对时间（如：2分钟前）
      expect(screen.getByText(/前/)).toBeInTheDocument()
    })

    it('应该显示已解决告警的解决时间', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const resolvedAlert = mockAlerts.find((a) => a.status === 'RESOLVED')
      if (resolvedAlert) {
        // 应该显示解决时间信息
        const row = screen.getByText('Memory Leak').closest('tr')
        if (row) {
          expect(within(row).getByText(/已解决/i)).toBeInTheDocument()
        }
      }
    })
  })

  describe('操作按钮', () => {
    it('应该为FIRING状态的告警显示静音按钮', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const firingRow = screen.getByText('High Response Time').closest('tr')
      if (firingRow) {
        expect(
          within(firingRow).getByRole('button', { name: /静音/i })
        ).toBeInTheDocument()
      }
    })

    it('应该在点击静音按钮时调用回调', () => {
      const onSilence = jest.fn()

      render(
        <AlertsTable
          alerts={mockAlerts}
          pagination={mockPagination}
          onSilence={onSilence}
        />
      )

      const firingRow = screen.getByText('High Response Time').closest('tr')
      if (firingRow) {
        const silenceButton = within(firingRow).getByRole('button', {
          name: /静音/i,
        })
        fireEvent.click(silenceButton)

        expect(onSilence).toHaveBeenCalledWith('alert-1')
      }
    })

    it('应该显示查看详情按钮', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const viewButtons = screen.getAllByRole('button', { name: /查看/i })
      expect(viewButtons.length).toBeGreaterThan(0)
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端隐藏某些列', () => {
      render(<AlertsTable alerts={mockAlerts} pagination={mockPagination} />)

      const table = screen.getByRole('table')
      expect(table).toHaveClass('responsive-table')
    })
  })
})
