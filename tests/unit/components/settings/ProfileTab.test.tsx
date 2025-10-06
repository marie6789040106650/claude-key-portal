/**
 * ProfileTab 组件测试
 * Sprint 14 - Phase 2 🔴 RED
 *
 * 测试个人信息标签页组件：
 * - 基本信息表单渲染
 * - 用户数据加载
 * - 表单验证
 * - 表单提交
 * - 头像上传
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileTab } from '@/components/settings/ProfileTab'
import type { UserProfile } from '@/types/user'

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

const { useQuery, useMutation } = require('@tanstack/react-query')

describe('ProfileTab', () => {
  const mockUserProfile: UserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-10-06T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful query
    useQuery.mockReturnValue({
      data: mockUserProfile,
      isLoading: false,
      isError: false,
      error: null,
    })

    // Mock mutation
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
    })
  })

  describe('数据加载', () => {
    it('加载时应该显示骨架屏', () => {
      useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      })

      render(<ProfileTab />)

      expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
    })

    it('加载成功应该显示用户信息', () => {
      render(<ProfileTab />)

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })

    it('加载失败应该显示错误提示', () => {
      useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load profile'),
      })

      render(<ProfileTab />)

      expect(screen.getByText(/加载失败/)).toBeInTheDocument()
    })
  })

  describe('基本信息表单', () => {
    it('应该渲染所有表单字段', () => {
      render(<ProfileTab />)

      expect(screen.getByLabelText(/昵称/)).toBeInTheDocument()
      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument()
      expect(screen.getByLabelText(/个人简介/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()
    })

    it('邮箱字段应该是禁用状态', () => {
      render(<ProfileTab />)

      const emailInput = screen.getByDisplayValue('test@example.com')
      expect(emailInput).toBeDisabled()
    })

    it('应该显示头像', () => {
      render(<ProfileTab />)

      const avatar = screen.getByTestId('user-avatar')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('表单验证', () => {
    it('应该验证昵称长度（1-50字符）', async () => {
      const user = userEvent.setup()
      render(<ProfileTab />)

      const nicknameInput = screen.getByLabelText(/昵称/)

      // 清空昵称（无效）
      await user.clear(nicknameInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/昵称至少需要1个字符/)).toBeInTheDocument()
      })

      // 输入超长昵称（无效）
      await user.type(nicknameInput, 'a'.repeat(51))
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/昵称最多50个字符/)).toBeInTheDocument()
      })
    })

    it('应该验证个人简介长度（最多500字符）', async () => {
      const user = userEvent.setup()
      render(<ProfileTab />)

      const bioInput = screen.getByLabelText(/个人简介/)

      // 输入超长简介（无效）
      await user.clear(bioInput)
      await user.type(bioInput, 'a'.repeat(501))
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/个人简介最多500个字符/)).toBeInTheDocument()
      })
    })

    it('有验证错误时保存按钮应该禁用', async () => {
      const user = userEvent.setup()
      render(<ProfileTab />)

      const nicknameInput = screen.getByLabelText(/昵称/)
      const saveButton = screen.getByRole('button', { name: /保存/i })

      // 清空昵称
      await user.clear(nicknameInput)
      await user.tab()

      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe('表单提交', () => {
    it('提交成功应该显示成功提示', async () => {
      const mockMutate = jest.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        isSuccess: true,
      })

      const user = userEvent.setup()
      render(<ProfileTab />)

      const nicknameInput = screen.getByLabelText(/昵称/)
      const saveButton = screen.getByRole('button', { name: /保存/i })

      // 修改昵称
      await user.clear(nicknameInput)
      await user.type(nicknameInput, 'Updated Name')

      // 提交表单
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          nickname: 'Updated Name',
          bio: 'Test bio',
        })
      })
    })

    it('提交失败应该显示错误提示', async () => {
      useMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: false,
        isError: true,
        error: new Error('Update failed'),
      })

      render(<ProfileTab />)

      expect(screen.getByText(/更新失败/)).toBeInTheDocument()
    })

    it('提交时应该禁用表单', () => {
      useMutation.mockReturnValue({
        mutate: jest.fn(),
        isLoading: true,
      })

      render(<ProfileTab />)

      const saveButton = screen.getByRole('button', { name: /保存中/i })
      expect(saveButton).toBeDisabled()
    })
  })
})
