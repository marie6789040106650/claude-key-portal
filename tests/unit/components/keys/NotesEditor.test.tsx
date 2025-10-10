/**
 * NotesEditor 组件测试
 * P1 阶段 - 备注功能 🔴 RED
 *
 * 测试备注编辑器组件:
 * - 编辑器渲染和交互
 * - 文本输入和格式化
 * - 自动保存功能
 * - 字符限制和验证
 * - Markdown 支持
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesEditor } from '@/components/keys/NotesEditor'

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

import { toast } from '@/components/ui/use-toast'
const mockToast = toast as jest.MockedFunction<typeof toast>

// Mock fetch
global.fetch = jest.fn()

describe('NotesEditor', () => {
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    mockToast.mockClear()
  })

  describe('编辑器渲染', () => {
    it('应该渲染编辑器容器', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      expect(screen.getByTestId('notes-editor')).toBeInTheDocument()
    })

    it('应该渲染文本域', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      expect(screen.getByTestId('notes-textarea')).toBeInTheDocument()
    })

    it('应该显示初始值', () => {
      const initialValue = '这是一条备注'

      render(
        <NotesEditor keyId="key-1" initialValue={initialValue} onSave={mockOnSave} />
      )

      expect(screen.getByTestId('notes-textarea')).toHaveValue(initialValue)
    })

    it('应该显示字符计数器', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      expect(screen.getByTestId('char-counter')).toBeInTheDocument()
      expect(screen.getByTestId('char-counter')).toHaveTextContent('0 / 1000')
    })

    it('应该显示保存按钮', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      expect(screen.getByTestId('save-button')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
    })

    it('空值时保存按钮应该禁用', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const saveButton = screen.getByTestId('save-button')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('文本输入', () => {
    it('应该能够输入文本', async () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '新的备注内容')

      expect(textarea).toHaveValue('新的备注内容')
    })

    it('输入文本时应该更新字符计数', async () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      const text = '测试备注'

      await userEvent.type(textarea, text)

      expect(screen.getByTestId('char-counter')).toHaveTextContent(
        `${text.length} / 1000`
      )
    })

    it('应该支持多行文本', async () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      const multilineText = '第一行\n第二行\n第三行'

      await userEvent.type(textarea, multilineText)

      expect(textarea).toHaveValue(multilineText)
    })

    it('应该限制最大字符数', async () => {
      render(<NotesEditor keyId="key-1" initialValue="" maxLength={100} onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      const longText = 'a'.repeat(150)

      await userEvent.type(textarea, longText)

      // 应该只保留前100个字符
      expect(textarea).toHaveValue(longText.slice(0, 100))
    })

    it('超过限制时应该显示警告', async () => {
      render(<NotesEditor keyId="key-1" initialValue="" maxLength={100} onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, 'a'.repeat(100))

      expect(screen.getByTestId('char-counter')).toHaveClass('text-red-500')
    })
  })

  describe('保存功能', () => {
    it('点击保存按钮应该调用 API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, description: '新备注' }),
      })

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '新备注')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys/key-1/notes',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: '新备注' }),
          })
        )
      })

      expect(mockOnSave).toHaveBeenCalledWith('新备注')
    })

    it('保存成功应该显示成功提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '保存成功',
        })
      })
    })

    it('保存期间应该禁用保存按钮', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      expect(saveButton).toBeDisabled()

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })
    })

    it('保存期间应该显示加载文本', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      expect(screen.getByText('保存中...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('保存中...')).not.toBeInTheDocument()
      })
    })
  })

  describe('自动保存', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('停止输入2秒后应该自动保存', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <NotesEditor
          keyId="key-1"
          initialValue=""
          autoSave={true}
          onSave={mockOnSave}
        />
      )

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '自动保存测试')

      // 等待2秒
      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('继续输入应该重置自动保存计时器', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <NotesEditor
          keyId="key-1"
          initialValue=""
          autoSave={true}
          onSave={mockOnSave}
        />
      )

      const textarea = screen.getByTestId('notes-textarea')

      await userEvent.type(textarea, 'a')
      jest.advanceTimersByTime(1000)

      await userEvent.type(textarea, 'b')
      jest.advanceTimersByTime(1000)

      await userEvent.type(textarea, 'c')
      jest.advanceTimersByTime(1000)

      // 此时不应该自动保存
      expect(global.fetch).not.toHaveBeenCalled()

      // 再等1秒，总共2秒没有输入
      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('自动保存时应该显示"自动保存中"提示', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      )

      render(
        <NotesEditor
          keyId="key-1"
          initialValue=""
          autoSave={true}
          onSave={mockOnSave}
        />
      )

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.getByText('自动保存中...')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('保存失败应该显示错误提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '服务器错误' }),
      })

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '保存失败，请重试',
          variant: 'destructive',
        })
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('网络错误应该显示友好提示', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const textarea = screen.getByTestId('notes-textarea')
      await userEvent.type(textarea, '测试')

      const saveButton = screen.getByTestId('save-button')
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '保存失败，请重试',
          variant: 'destructive',
        })
      })
    })
  })

  describe('无障碍支持', () => {
    it('文本域应该有正确的 label', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      expect(screen.getByLabelText('备注')).toBeInTheDocument()
    })

    it('保存按钮应该有正确的 aria-label', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const saveButton = screen.getByTestId('save-button')
      expect(saveButton).toHaveAttribute('aria-label', '保存备注')
    })

    it('字符计数器应该有 aria-live 属性', () => {
      render(<NotesEditor keyId="key-1" initialValue="" onSave={mockOnSave} />)

      const charCounter = screen.getByTestId('char-counter')
      expect(charCounter).toHaveAttribute('aria-live', 'polite')
    })
  })
})
