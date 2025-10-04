/**
 * KeysTable 组件测试
 * Sprint 12 - Phase 4 🔴 RED
 *
 * 测试密钥列表表格组件:
 * - 表格渲染
 * - 密钥数据显示
 * - 排序和过滤
 * - 分页功能
 * - 操作按钮
 * - 空状态和错误状态
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KeysTable } from '@/components/keys/KeysTable'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('KeysTable', () => {
  const mockKeys = [
    {
      id: 'key-1',
      name: 'Production Key',
      keyPrefix: 'sk-ant-',
      keyMasked: 'sk-ant-***abc1',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      totalRequests: 1234,
      totalTokens: 56789,
      lastUsedAt: '2025-01-10T12:00:00.000Z',
    },
    {
      id: 'key-2',
      name: 'Development Key',
      keyPrefix: 'sk-ant-',
      keyMasked: 'sk-ant-***def2',
      status: 'INACTIVE',
      createdAt: '2025-01-05T00:00:00.000Z',
      totalRequests: 567,
      totalTokens: 12345,
      lastUsedAt: '2025-01-08T10:00:00.000Z',
    },
    {
      id: 'key-3',
      name: 'Test Key',
      keyPrefix: 'sk-ant-',
      keyMasked: 'sk-ant-***ghi3',
      status: 'EXPIRED',
      createdAt: '2024-12-01T00:00:00.000Z',
      totalRequests: 89,
      totalTokens: 2345,
      lastUsedAt: '2024-12-25T08:00:00.000Z',
    },
  ]

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCopy: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础渲染测试', () => {
    it('应该渲染表格容器', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const table = screen.getByTestId('keys-table')
      expect(table).toBeInTheDocument()
    })

    it('应该渲染表头', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByText('名称')).toBeInTheDocument()
      expect(screen.getByText('密钥前缀')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
      expect(screen.getByText('创建时间')).toBeInTheDocument()
      expect(screen.getByText('使用量')).toBeInTheDocument()
      expect(screen.getByText('操作')).toBeInTheDocument()
    })

    it('应该正确显示所有密钥数据', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByText('Production Key')).toBeInTheDocument()
      expect(screen.getByText('Development Key')).toBeInTheDocument()
      expect(screen.getByText('Test Key')).toBeInTheDocument()
    })

    it('应该正确显示密钥掩码', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getByText('sk-ant-***abc1')).toBeInTheDocument()
      expect(screen.getByText('sk-ant-***def2')).toBeInTheDocument()
      expect(screen.getByText('sk-ant-***ghi3')).toBeInTheDocument()
    })

    it('应该正确显示密钥状态', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const activeStatus = screen.getByTestId('status-key-1')
      const inactiveStatus = screen.getByTestId('status-key-2')
      const expiredStatus = screen.getByTestId('status-key-3')

      expect(activeStatus).toHaveTextContent('激活')
      expect(inactiveStatus).toHaveTextContent('未激活')
      expect(expiredStatus).toHaveTextContent('已过期')
    })
  })

  describe('排序功能测试', () => {
    it('应该支持按名称排序', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const nameHeader = screen.getByTestId('sort-name')
      fireEvent.click(nameHeader)

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows[0]).toHaveTextContent('Development Key')
      expect(rows[1]).toHaveTextContent('Production Key')
      expect(rows[2]).toHaveTextContent('Test Key')
    })

    it('应该支持按创建时间排序', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const dateHeader = screen.getByTestId('sort-created')
      fireEvent.click(dateHeader)

      const rows = screen.getAllByTestId(/^key-row-/)
      // 默认降序：最新的在前
      expect(rows[0]).toHaveTextContent('Development Key') // 2025-01-05
      expect(rows[1]).toHaveTextContent('Production Key') // 2025-01-01
      expect(rows[2]).toHaveTextContent('Test Key') // 2024-12-01
    })

    it('应该支持升序/降序切换', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const nameHeader = screen.getByTestId('sort-name')

      // 第一次点击：升序
      fireEvent.click(nameHeader)
      expect(screen.getByTestId('sort-icon-asc')).toBeInTheDocument()

      // 第二次点击：降序
      fireEvent.click(nameHeader)
      expect(screen.getByTestId('sort-icon-desc')).toBeInTheDocument()
    })

    it('应该显示排序指示器', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const nameHeader = screen.getByTestId('sort-name')
      fireEvent.click(nameHeader)

      const sortIcon = screen.getByTestId('sort-icon-asc')
      expect(sortIcon).toBeInTheDocument()
    })

    it('应该在排序后保持选中状态', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} selectable />)

      // 选中第一个密钥
      const checkbox1 = screen.getByTestId('checkbox-key-1')
      fireEvent.click(checkbox1)
      expect(checkbox1).toBeChecked()

      // 排序
      const nameHeader = screen.getByTestId('sort-name')
      fireEvent.click(nameHeader)

      // 选中状态应该保持
      expect(checkbox1).toBeChecked()
    })
  })

  describe('过滤功能测试', () => {
    it('应该支持按状态过滤', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} filterable />)

      const statusFilter = screen.getByTestId('filter-status')
      fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } })

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Production Key')
    })

    it('应该支持按名称搜索', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} searchable />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'Production' } })

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Production Key')
    })

    it('搜索应该不区分大小写', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} searchable />)

      const searchInput = screen.getByTestId('search-input')
      fireEvent.change(searchInput, { target: { value: 'production' } })

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Production Key')
    })

    it('应该显示过滤结果数量', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} filterable />)

      const statusFilter = screen.getByTestId('filter-status')
      fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } })

      const resultCount = screen.getByTestId('filter-result-count')
      expect(resultCount).toHaveTextContent('显示 1 / 3 个密钥')
    })

    it('应该支持清除过滤条件', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} filterable />)

      const statusFilter = screen.getByTestId('filter-status')
      fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } })

      let rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(1)

      const clearButton = screen.getByTestId('clear-filters')
      fireEvent.click(clearButton)

      rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(3)
    })
  })

  describe('分页功能测试', () => {
    const manyKeys = Array.from({ length: 25 }, (_, i) => ({
      id: `key-${i + 1}`,
      name: `Key ${i + 1}`,
      keyPrefix: 'sk-ant-',
      keyMasked: `sk-ant-***${i + 1}`,
      status: 'ACTIVE',
      createdAt: new Date(2025, 0, i + 1).toISOString(),
      totalRequests: i * 100,
      totalTokens: i * 1000,
      lastUsedAt: new Date(2025, 0, i + 1).toISOString(),
    }))

    it('应该正确分页显示', () => {
      render(<KeysTable keys={manyKeys} {...mockHandlers} pageSize={10} />)

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows).toHaveLength(10)
    })

    it('应该显示分页控件', () => {
      render(<KeysTable keys={manyKeys} {...mockHandlers} pageSize={10} />)

      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByTestId('prev-page')).toBeInTheDocument()
      expect(screen.getByTestId('next-page')).toBeInTheDocument()
    })

    it('应该支持翻页', () => {
      render(<KeysTable keys={manyKeys} {...mockHandlers} pageSize={10} />)

      const nextButton = screen.getByTestId('next-page')
      fireEvent.click(nextButton)

      const rows = screen.getAllByTestId(/^key-row-/)
      expect(rows[0]).toHaveTextContent('Key 11')
    })

    it('应该在首页禁用上一页按钮', () => {
      render(<KeysTable keys={manyKeys} {...mockHandlers} pageSize={10} />)

      const prevButton = screen.getByTestId('prev-page')
      expect(prevButton).toBeDisabled()
    })

    it('应该显示当前页码信息', () => {
      render(<KeysTable keys={manyKeys} {...mockHandlers} pageSize={10} />)

      const pageInfo = screen.getByTestId('page-info')
      expect(pageInfo).toHaveTextContent('1 / 3')
    })
  })

  describe('操作按钮测试', () => {
    it('应该渲染操作按钮', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      expect(screen.getAllByTestId(/^edit-button-/)).toHaveLength(3)
      expect(screen.getAllByTestId(/^delete-button-/)).toHaveLength(3)
      expect(screen.getAllByTestId(/^copy-button-/)).toHaveLength(3)
    })

    it('点击编辑按钮应该触发回调', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const editButton = screen.getByTestId('edit-button-key-1')
      fireEvent.click(editButton)

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockKeys[0])
    })

    it('点击删除按钮应该触发回调', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const deleteButton = screen.getByTestId('delete-button-key-1')
      fireEvent.click(deleteButton)

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockKeys[0])
    })

    it('点击复制按钮应该触发回调', () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const copyButton = screen.getByTestId('copy-button-key-1')
      fireEvent.click(copyButton)

      expect(mockHandlers.onCopy).toHaveBeenCalledWith(mockKeys[0].id)
    })

    it('复制成功应该显示提示', async () => {
      render(<KeysTable keys={mockKeys} {...mockHandlers} />)

      const copyButton = screen.getByTestId('copy-button-key-1')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('已复制到剪贴板')).toBeInTheDocument()
      })
    })
  })

  describe('空状态和错误处理测试', () => {
    it('无密钥时应该显示空状态', () => {
      render(<KeysTable keys={[]} {...mockHandlers} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('暂无密钥')).toBeInTheDocument()
    })

    it('空状态应该显示创建按钮', () => {
      const onCreateKey = jest.fn()
      render(
        <KeysTable keys={[]} {...mockHandlers} onCreateKey={onCreateKey} />
      )

      const createButton = screen.getByTestId('create-key-button')
      fireEvent.click(createButton)

      expect(onCreateKey).toHaveBeenCalled()
    })

    it('加载中应该显示骨架屏', () => {
      render(<KeysTable keys={[]} {...mockHandlers} loading />)

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })

    it('错误状态应该显示错误提示', () => {
      const error = new Error('加载失败')
      render(<KeysTable keys={[]} {...mockHandlers} error={error} />)

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
      expect(screen.getByText('加载失败')).toBeInTheDocument()
    })

    it('错误状态应该显示重试按钮', () => {
      const onRetry = jest.fn()
      const error = new Error('加载失败')
      render(
        <KeysTable keys={[]} {...mockHandlers} error={error} onRetry={onRetry} />
      )

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalled()
    })
  })
})
