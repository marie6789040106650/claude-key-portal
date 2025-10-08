/**
 * InstallPage 页面测试
 * Sprint MVP - Phase 1 🔴 RED
 *
 * 测试安装指导页面:
 * - 页面渲染
 * - 平台检测和选择
 * - 密钥选择
 * - 配置脚本生成
 * - 一键复制功能
 * - 安装步骤展示
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import InstallPage from '@/app/dashboard/install/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

// Test wrapper with React Query
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const renderWithClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  )
}

describe('InstallPage', () => {
  const mockKeys = [
    {
      id: 'key-1',
      name: 'Production Key',
      crsKey: 'sk-ant-api03-test-key-1',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'key-2',
      name: 'Development Key',
      crsKey: 'sk-ant-api03-test-key-2',
      status: 'ACTIVE',
      createdAt: '2025-01-05T00:00:00.000Z',
    },
  ]

  const mockScriptResponse = {
    platform: 'macos',
    environment: 'zsh',
    envVars: `export ANTHROPIC_BASE_URL="https://claude.just-play.fun/api"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-test-key-1"
export CRS_OAI_KEY="sk-ant-api03-test-key-1"`,
    codexConfig: `[api]
base_url = "https://claude.just-play.fun/api"
api_key = "sk-ant-api03-test-key-1"

[auth]
token = "sk-ant-api03-test-key-1"`,
    instructions: [
      '打开终端',
      '编辑 ~/.zshrc 文件',
      '将环境变量配置添加到文件末尾',
      '运行 source ~/.zshrc 重载配置',
      '验证配置：echo $ANTHROPIC_BASE_URL',
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API calls
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/keys')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ keys: mockKeys }),
        })
      }
      if (url.includes('/api/install/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScriptResponse),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/安装指导/i)).toBeInTheDocument()
      })
    })

    it('应该显示平台选择器', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/选择平台/i)).toBeInTheDocument()
      })
    })

    it('应该显示密钥选择器', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/选择密钥/i)).toBeInTheDocument()
      })
    })
  })

  describe('平台检测与选择', () => {
    it('应该自动检测用户平台', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        // macOS平台应该被预选
        const macosOption = screen.getByRole('button', { name: /macOS/i })
        expect(macosOption).toHaveClass('selected')
      })
    })

    it('应该允许用户切换平台', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const windowsOption = screen.getByRole('button', { name: /Windows/i })
        await user.click(windowsOption)

        expect(windowsOption).toHaveClass('selected')
      })
    })

    it('切换平台后应该更新环境选项', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const windowsOption = screen.getByRole('button', { name: /Windows/i })
        await user.click(windowsOption)

        // Windows平台应该显示PowerShell选项
        expect(screen.getByText(/PowerShell/i)).toBeInTheDocument()
      })
    })
  })

  describe('密钥选择', () => {
    it('应该显示用户的所有密钥', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument()
        expect(screen.getByText('Development Key')).toBeInTheDocument()
      })
    })

    it('应该默认选中第一个密钥', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        const firstKey = screen.getByText('Production Key').closest('div')
        expect(firstKey).toHaveClass('selected')
      })
    })

    it('应该允许用户切换密钥', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const secondKey = screen.getByText('Development Key')
        await user.click(secondKey)

        expect(secondKey.closest('div')).toHaveClass('selected')
      })
    })
  })

  describe('配置脚本生成', () => {
    it('选择密钥后应该自动生成脚本', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/export ANTHROPIC_BASE_URL/i)).toBeInTheDocument()
      })
    })

    it('切换平台后应该重新生成脚本', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      // 切换到Windows
      await waitFor(async () => {
        const windowsOption = screen.getByRole('button', { name: /Windows/i })
        await user.click(windowsOption)
      })

      // 应该调用生成API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/install/generate'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('windows'),
          })
        )
      })
    })

    it('应该显示环境变量配置', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/ANTHROPIC_BASE_URL/i)).toBeInTheDocument()
        expect(screen.getByText(/ANTHROPIC_AUTH_TOKEN/i)).toBeInTheDocument()
      })
    })

    it('应该显示Codex配置', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/\[api\]/i)).toBeInTheDocument()
        expect(screen.getByText(/base_url/i)).toBeInTheDocument()
      })
    })
  })

  describe('一键复制功能', () => {
    it('应该显示复制按钮', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /复制/i })
        expect(copyButtons.length).toBeGreaterThan(0)
      })
    })

    it('点击复制按钮应该复制脚本到剪贴板', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const copyButton = screen.getAllByRole('button', { name: /复制/i })[0]
        await user.click(copyButton)

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('export ANTHROPIC_BASE_URL')
        )
      })
    })

    it('复制成功后应该显示提示', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const copyButton = screen.getAllByRole('button', { name: /复制/i })[0]
        await user.click(copyButton)

        expect(screen.getByText(/复制成功/i)).toBeInTheDocument()
      })
    })
  })

  describe('安装步骤展示', () => {
    it('应该显示安装步骤列表', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        mockScriptResponse.instructions.forEach((instruction) => {
          expect(screen.getByText(instruction)).toBeInTheDocument()
        })
      })
    })

    it('步骤应该按顺序编号', async () => {
      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText('1.')).toBeInTheDocument()
        expect(screen.getByText('2.')).toBeInTheDocument()
        expect(screen.getByText('3.')).toBeInTheDocument()
      })
    })

    it('应该根据平台显示不同的步骤', async () => {
      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      // macOS平台
      await waitFor(() => {
        expect(screen.getByText(/\.zshrc/i)).toBeInTheDocument()
      })

      // 切换到Windows
      await waitFor(async () => {
        const windowsOption = screen.getByRole('button', { name: /Windows/i })
        await user.click(windowsOption)
      })

      // Windows平台应该显示PowerShell相关步骤
      await waitFor(() => {
        expect(screen.getByText(/PowerShell/i)).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('密钥加载失败时应该显示错误提示', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load keys')
      )

      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/加载密钥失败/i)).toBeInTheDocument()
      })
    })

    it('脚本生成失败时应该显示错误提示', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/keys')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ keys: mockKeys }),
          })
        }
        if (url.includes('/api/install/generate')) {
          return Promise.reject(new Error('Generation failed'))
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      renderWithClient(<InstallPage />)

      await waitFor(() => {
        expect(screen.getByText(/生成脚本失败/i)).toBeInTheDocument()
      })
    })

    it('复制失败时应该显示错误提示', async () => {
      ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Copy failed')
      )

      renderWithClient(<InstallPage />)
      const user = userEvent.setup()

      await waitFor(async () => {
        const copyButton = screen.getAllByRole('button', { name: /复制/i })[0]
        await user.click(copyButton)

        expect(screen.getByText(/复制失败/i)).toBeInTheDocument()
      })
    })
  })

  describe('响应式设计', () => {
    it('在移动设备上应该调整布局', async () => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      renderWithClient(<InstallPage />)

      await waitFor(() => {
        const container = screen.getByTestId('install-container')
        expect(container).toHaveClass('mobile-layout')
      })
    })
  })
})
