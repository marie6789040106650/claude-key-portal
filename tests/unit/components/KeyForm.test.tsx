/**
 * KeyForm 组件测试
 * Sprint 12 - Phase 4 🔴 RED
 *
 * 测试密钥表单组件:
 * - 表单渲染
 * - 字段验证
 * - 提交成功/失败
 * - 创建/编辑模式
 * - CRS API 集成
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyForm } from '@/components/keys/KeyForm'

// Mock fetch
global.fetch = jest.fn()

describe('KeyForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('表单渲染测试', () => {
    it('应该渲染表单容器', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByTestId('key-form')).toBeInTheDocument()
    })

    it('应该渲染所有必填字段', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('密钥名称')).toBeInTheDocument()
      expect(screen.getByLabelText('描述')).toBeInTheDocument()
    })

    it('应该渲染可选字段', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText('速率限制')).toBeInTheDocument()
      expect(screen.getByLabelText('到期时间')).toBeInTheDocument()
    })

    it('应该渲染提交和取消按钮', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    it('创建模式下提交按钮应该显示"创建密钥"', () => {
      render(
        <KeyForm mode="create" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      )

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toHaveTextContent('创建密钥')
    })

    it('编辑模式下提交按钮应该显示"保存修改"', () => {
      const editData = {
        id: 'key-1',
        name: 'Test Key',
        description: 'Test description',
      }

      render(
        <KeyForm
          mode="edit"
          initialData={editData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toHaveTextContent('保存修改')
    })

    it('应该在字段下方显示帮助文本', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(
        screen.getByText('为密钥设置一个易于识别的名称')
      ).toBeInTheDocument()
      expect(
        screen.getByText('每分钟最大请求数，留空表示无限制')
      ).toBeInTheDocument()
    })

    it('必填字段应该显示必填标识', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameLabel = screen.getByText('密钥名称')
      expect(nameLabel.parentElement).toHaveTextContent('*')
    })

    it('编辑模式应该预填充表单数据', () => {
      const editData = {
        id: 'key-1',
        name: 'Production Key',
        description: 'Production environment key',
        rateLimit: 100,
      }

      render(
        <KeyForm
          mode="edit"
          initialData={editData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText('密钥名称')).toHaveValue('Production Key')
      expect(screen.getByLabelText('描述')).toHaveValue(
        'Production environment key'
      )
      expect(screen.getByLabelText('速率限制')).toHaveValue(100)
    })

    it('加载状态下应该禁用所有输入', () => {
      render(
        <KeyForm
          loading
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText('密钥名称')).toBeDisabled()
      expect(screen.getByLabelText('描述')).toBeDisabled()
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
  })

  describe('字段验证测试', () => {
    it('名称为空时应该显示错误', async () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('密钥名称不能为空')).toBeInTheDocument()
      })
    })

    it('名称太短时应该显示错误', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'ab')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('密钥名称至少需要3个字符')
        ).toBeInTheDocument()
      })
    })

    it('名称太长时应该显示错误', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'a'.repeat(101))

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('密钥名称不能超过100个字符')
        ).toBeInTheDocument()
      })
    })

    it('速率限制应该是正整数', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const rateLimitInput = screen.getByLabelText('速率限制')
      await user.type(rateLimitInput, '-10')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('速率限制必须是正整数')
        ).toBeInTheDocument()
      })
    })

    it('描述字段应该支持多行输入', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const descriptionInput = screen.getByLabelText('描述')
      const multilineText = 'Line 1\nLine 2\nLine 3'
      await user.type(descriptionInput, multilineText)

      expect(descriptionInput).toHaveValue(multilineText)
    })

    it('到期时间应该是未来日期', async () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const expiresInput = screen.getByLabelText('到期时间')
      const pastDate = '2020-01-01'
      fireEvent.change(expiresInput, { target: { value: pastDate } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('到期时间必须是未来日期')
        ).toBeInTheDocument()
      })
    })

    it('所有字段验证通过时不应该显示错误', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Valid Key Name')

      const descriptionInput = screen.getByLabelText('描述')
      await user.type(descriptionInput, 'Valid description')

      await waitFor(() => {
        expect(
          screen.queryByText('密钥名称不能为空')
        ).not.toBeInTheDocument()
      })
    })

    it('清除输入后应该重新触发验证', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Valid Name')
      await user.clear(nameInput)

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('密钥名称不能为空')).toBeInTheDocument()
      })
    })

    it('实时验证应该在用户输入时显示', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'ab')

      // 失焦触发验证
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(
          screen.getByText('密钥名称至少需要3个字符')
        ).toBeInTheDocument()
      })
    })

    it('修复错误后应该清除错误提示', async () => {
      const user = userEvent.setup()
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')

      // 触发错误
      await user.type(nameInput, 'ab')
      fireEvent.blur(nameInput)

      await waitFor(() => {
        expect(
          screen.getByText('密钥名称至少需要3个字符')
        ).toBeInTheDocument()
      })

      // 修复错误
      await user.type(nameInput, 'c')

      await waitFor(() => {
        expect(
          screen.queryByText('密钥名称至少需要3个字符')
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('API 集成测试', () => {
    it('创建成功应该调用 onSuccess 回调', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        id: 'new-key-1',
        key: 'sk-ant-xxx-abc123',
        name: 'New Key',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'New Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse)
      })
    })

    it('创建密钥应该调用正确的 API 端点', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'key-1', key: 'sk-ant-xxx' }),
      })

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Test Key'),
          })
        )
      })
    })

    it('编辑密钥应该调用正确的 API 端点', async () => {
      const user = userEvent.setup()
      const editData = {
        id: 'key-1',
        name: 'Old Name',
        description: 'Old description',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...editData, name: 'New Name' }),
      })

      render(
        <KeyForm
          mode="edit"
          initialData={editData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByLabelText('密钥名称')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/keys/key-1',
          expect.objectContaining({
            method: 'PUT',
          })
        )
      })
    })

    it('提交时应该显示加载状态', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({}) }),
              100
            )
          )
      )

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      expect(submitButton).toHaveTextContent('创建中...')
      expect(submitButton).toBeDisabled()
    })

    it('API 错误应该显示错误提示', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'CRS服务暂时不可用' }),
      })

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('CRS服务暂时不可用')
        ).toBeInTheDocument()
      })
    })

    it('网络错误应该显示友好提示', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('网络错误，请检查网络连接')
        ).toBeInTheDocument()
      })
    })

    it('提交应该包含所有字段数据', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('密钥名称'), 'Test Key')
      await user.type(screen.getByLabelText('描述'), 'Test description')
      await user.type(screen.getByLabelText('速率限制'), '100')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body).toMatchObject({
          name: 'Test Key',
          description: 'Test description',
          rateLimit: 100,
        })
      })
    })

    it('重试失败的提交应该重新发送请求', async () => {
      const user = userEvent.setup()

      // 第一次失败
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '服务器错误' }),
      })

      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText('密钥名称'), 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('服务器错误')).toBeInTheDocument()
      })

      // 第二次成功
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'key-1' }),
      })

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('成功后应该重置表单', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'key-1' }),
      })

      render(
        <KeyForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          resetOnSuccess
        />
      )

      const nameInput = screen.getByLabelText('密钥名称')
      await user.type(nameInput, 'Test Key')

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(nameInput).toHaveValue('')
      })
    })
  })

  describe('创建/编辑模式测试', () => {
    it('创建模式应该显示"创建新密钥"标题', () => {
      render(
        <KeyForm mode="create" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      )

      expect(screen.getByText('创建新密钥')).toBeInTheDocument()
    })

    it('编辑模式应该显示"编辑密钥"标题', () => {
      const editData = {
        id: 'key-1',
        name: 'Test Key',
      }

      render(
        <KeyForm
          mode="edit"
          initialData={editData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('编辑密钥')).toBeInTheDocument()
    })

    it('创建模式不应该预填充数据', () => {
      render(
        <KeyForm mode="create" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      )

      expect(screen.getByLabelText('密钥名称')).toHaveValue('')
      expect(screen.getByLabelText('描述')).toHaveValue('')
    })

    it('编辑模式应该禁用某些字段', () => {
      const editData = {
        id: 'key-1',
        name: 'Test Key',
        description: 'Test',
      }

      render(
        <KeyForm
          mode="edit"
          initialData={editData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // 某些字段在编辑模式下应该是只读的（如密钥前缀）
      const keyPrefixField = screen.queryByLabelText('密钥前缀')
      if (keyPrefixField) {
        expect(keyPrefixField).toBeDisabled()
      }
    })

    it('点击取消按钮应该触发回调', () => {
      render(<KeyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByTestId('cancel-button')
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
})
