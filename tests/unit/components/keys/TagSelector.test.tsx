/**
 * TagSelector 组件测试
 * P1 阶段 - 标签功能 🔴 RED
 *
 * 测试标签选择器组件:
 * - 标签显示和选择
 * - 添加和删除标签
 * - 标签搜索和筛选
 * - 输入验证
 * - API 集成
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagSelector } from '@/components/keys/TagSelector'

// Mock fetch
global.fetch = jest.fn()

describe('TagSelector', () => {
  const mockOnChange = jest.fn()
  const existingTags = ['生产环境', '测试环境', '开发环境']

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('组件渲染', () => {
    it('应该渲染标签选择器容器', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByTestId('tag-selector')).toBeInTheDocument()
    })

    it('应该显示已选择的标签', () => {
      const selectedTags = ['生产环境', '重要']

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={selectedTags}
          onChange={mockOnChange}
        />
      )

      selectedTags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument()
      })
    })

    it('应该显示标签输入框', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByPlaceholderText('添加标签...')).toBeInTheDocument()
    })

    it('空标签列表应该显示提示', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('暂无标签')).toBeInTheDocument()
    })
  })

  describe('添加标签', () => {
    it('输入标签名并按回车应该添加标签', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tags: ['新标签'] }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '新标签{enter}')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['新标签'])
      })
    })

    it('点击添加按钮应该添加标签', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '新标签')

      const addButton = screen.getByTestId('add-tag-button')
      await userEvent.click(addButton)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })

    it('添加重复标签应该显示提示', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['已存在']}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '已存在{enter}')

      expect(screen.getByText('标签已存在')).toBeInTheDocument()
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('标签名应该去除首尾空格', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '  空格标签  {enter}')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['空格标签'])
      })
    })

    it('空标签名应该不能添加', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '   {enter}')

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('标签名长度应该有限制', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          maxLength={20}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      const longTag = 'a'.repeat(30)

      await userEvent.type(input, longTag)

      expect(input).toHaveValue(longTag.slice(0, 20))
    })

    it('添加标签后应该清空输入框', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '新标签{enter}')

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('删除标签', () => {
    it('点击删除按钮应该移除标签', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签1', '标签2']}
          onChange={mockOnChange}
        />
      )

      const deleteButtons = screen.getAllByTestId('delete-tag-button')
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['标签2'])
      })
    })

    it('删除标签应该调用 API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['要删除的标签']}
          onChange={mockOnChange}
        />
      )

      const deleteButton = screen.getByTestId('delete-tag-button')
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys/key-1/tags',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ tag: '要删除的标签' }),
          })
        )
      })
    })

    it('删除最后一个标签后应该显示提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['最后的标签']}
          onChange={mockOnChange}
        />
      )

      const deleteButton = screen.getByTestId('delete-tag-button')
      await userEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('暂无标签')).toBeInTheDocument()
      })
    })
  })

  describe('标签建议', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tags: existingTags,
        }),
      })
    })

    it('应该获取并显示现有标签列表', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.click(input)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tags')
      })

      await waitFor(() => {
        existingTags.forEach((tag) => {
          expect(screen.getByText(tag)).toBeInTheDocument()
        })
      })
    })

    it('输入时应该筛选标签建议', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '生产')

      await waitFor(() => {
        expect(screen.getByText('生产环境')).toBeInTheDocument()
        expect(screen.queryByText('开发环境')).not.toBeInTheDocument()
      })
    })

    it('点击建议标签应该添加', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tags: existingTags }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByText('生产环境')).toBeInTheDocument()
      })

      const suggestion = screen.getByText('生产环境')
      await userEvent.click(suggestion)

      expect(mockOnChange).toHaveBeenCalledWith(['生产环境'])
    })

    it('应该过滤已选择的标签', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['生产环境']}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.queryByText('生产环境')).not.toBeInTheDocument()
        expect(screen.getByText('测试环境')).toBeInTheDocument()
      })
    })
  })

  describe('标签限制', () => {
    it('应该限制最大标签数量', async () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签1', '标签2', '标签3']}
          maxTags={3}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '标签4{enter}')

      expect(screen.getByText('最多只能添加 3 个标签')).toBeInTheDocument()
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('达到限制时应该禁用输入', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签1', '标签2', '标签3']}
          maxTags={3}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      expect(input).toBeDisabled()
    })

    it('删除标签后应该重新启用输入', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { rerender } = render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签1', '标签2', '标签3']}
          maxTags={3}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      expect(input).toBeDisabled()

      // 模拟删除一个标签
      rerender(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签1', '标签2']}
          maxTags={3}
          onChange={mockOnChange}
        />
      )

      expect(input).not.toBeDisabled()
    })
  })

  describe('错误处理', () => {
    it('添加标签失败应该显示错误', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '服务器错误' }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.type(input, '新标签{enter}')

      await waitFor(() => {
        expect(screen.getByText('添加标签失败')).toBeInTheDocument()
      })

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('获取标签列表失败应该显示提示', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByText('无法加载标签列表')).toBeInTheDocument()
      })
    })
  })

  describe('样式和视觉', () => {
    it('每个标签应该有不同的颜色', () => {
      const tags = ['标签1', '标签2', '标签3']

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={tags}
          onChange={mockOnChange}
        />
      )

      const tagElements = screen.getAllByTestId('tag-item')
      const colors = tagElements.map((el) =>
        el.className.match(/bg-\w+-\d+/)?.[0]
      )

      // 应该使用不同的颜色
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBeGreaterThan(1)
    })

    it('标签应该有圆角边框', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签']}
          onChange={mockOnChange}
        />
      )

      const tag = screen.getByTestId('tag-item')
      expect(tag).toHaveClass('rounded-full')
    })

    it('删除按钮 hover 时应该有视觉反馈', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['标签']}
          onChange={mockOnChange}
        />
      )

      const deleteButton = screen.getByTestId('delete-tag-button')
      expect(deleteButton).toHaveClass('hover:bg-red-100')
    })
  })

  describe('无障碍支持', () => {
    it('输入框应该有正确的 label', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('标签')).toBeInTheDocument()
    })

    it('每个标签应该有删除按钮的 aria-label', () => {
      render(
        <TagSelector
          keyId="key-1"
          selectedTags={['测试标签']}
          onChange={mockOnChange}
        />
      )

      const deleteButton = screen.getByTestId('delete-tag-button')
      expect(deleteButton).toHaveAttribute('aria-label', '删除标签 测试标签')
    })

    it('标签建议列表应该有 role 属性', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ tags: existingTags }),
      })

      render(
        <TagSelector
          keyId="key-1"
          selectedTags={[]}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByPlaceholderText('添加标签...')
      await userEvent.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
    })
  })
})
