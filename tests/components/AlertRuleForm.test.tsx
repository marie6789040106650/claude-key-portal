/**
 * AlertRuleForm 组件测试
 *
 * 测试告警规则配置表单的渲染、验证和提交
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AlertRuleForm } from '@/components/monitor/AlertRuleForm'
import { MetricType, AlertCondition, AlertSeverity } from '@prisma/client'

describe('AlertRuleForm', () => {
  const mockRule = {
    id: 'rule-1',
    name: 'High Response Time',
    metric: 'RESPONSE_TIME' as MetricType,
    condition: 'GREATER_THAN' as AlertCondition,
    threshold: 1000,
    duration: 300,
    severity: 'WARNING' as AlertSeverity,
    enabled: true,
    channels: ['email', 'webhook'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('基本渲染', () => {
    it('应该渲染表单标题', () => {
      render(<AlertRuleForm />)

      expect(screen.getByText(/告警规则配置/i)).toBeInTheDocument()
    })

    it('应该显示所有必需的表单字段', () => {
      render(<AlertRuleForm />)

      expect(screen.getByLabelText(/规则名称/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/监控指标/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/条件/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/阈值/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/持续时间/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/严重程度/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/通知渠道/i)).toBeInTheDocument()
    })

    it('应该显示提交按钮', () => {
      render(<AlertRuleForm />)

      expect(
        screen.getByRole('button', { name: /保存规则/i })
      ).toBeInTheDocument()
    })

    it('应该显示取消按钮', () => {
      render(<AlertRuleForm />)

      expect(
        screen.getByRole('button', { name: /取消/i })
      ).toBeInTheDocument()
    })
  })

  describe('编辑模式', () => {
    it('应该在编辑模式下预填充表单', () => {
      render(<AlertRuleForm rule={mockRule} mode="edit" />)

      const nameInput = screen.getByLabelText(/规则名称/i) as HTMLInputElement
      expect(nameInput.value).toBe('High Response Time')

      const thresholdInput = screen.getByLabelText(/阈值/i) as HTMLInputElement
      expect(thresholdInput.value).toBe('1000')
    })

    it('应该在编辑模式下显示不同的标题', () => {
      render(<AlertRuleForm rule={mockRule} mode="edit" />)

      expect(screen.getByText(/编辑告警规则/i)).toBeInTheDocument()
    })

    it('应该在编辑模式下预选通知渠道', () => {
      render(<AlertRuleForm rule={mockRule} mode="edit" />)

      const emailCheckbox = screen.getByRole('checkbox', {
        name: /邮件/i,
      }) as HTMLInputElement
      expect(emailCheckbox.checked).toBe(true)

      const webhookCheckbox = screen.getByRole('checkbox', {
        name: /Webhook/i,
      }) as HTMLInputElement
      expect(webhookCheckbox.checked).toBe(true)
    })
  })

  describe('表单验证', () => {
    it('应该要求规则名称不为空', async () => {
      render(<AlertRuleForm />)

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/规则名称不能为空/i)).toBeInTheDocument()
      })
    })

    it('应该要求阈值为正数', async () => {
      render(<AlertRuleForm />)

      const thresholdInput = screen.getByLabelText(/阈值/i)
      fireEvent.change(thresholdInput, { target: { value: '-100' } })

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/阈值必须为正数/i)).toBeInTheDocument()
      })
    })

    it('应该要求持续时间为正数', async () => {
      render(<AlertRuleForm />)

      const durationInput = screen.getByLabelText(/持续时间/i)
      fireEvent.change(durationInput, { target: { value: '0' } })

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/持续时间必须大于0/i)).toBeInTheDocument()
      })
    })

    it('应该要求至少选择一个通知渠道', async () => {
      render(<AlertRuleForm />)

      // 填写其他必需字段
      fireEvent.change(screen.getByLabelText(/规则名称/i), {
        target: { value: 'Test Rule' },
      })
      fireEvent.change(screen.getByLabelText(/阈值/i), {
        target: { value: '1000' },
      })

      // 不选择任何通知渠道

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/至少选择一个通知渠道/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('表单提交', () => {
    it('应该在提交成功时调用回调', async () => {
      const onSubmit = jest.fn().mockResolvedValue({ success: true })

      render(<AlertRuleForm onSubmit={onSubmit} />)

      // 填写表单
      fireEvent.change(screen.getByLabelText(/规则名称/i), {
        target: { value: 'New Rule' },
      })
      fireEvent.change(screen.getByLabelText(/阈值/i), {
        target: { value: '1500' },
      })
      fireEvent.change(screen.getByLabelText(/持续时间/i), {
        target: { value: '300' },
      })

      // 选择通知渠道
      const emailCheckbox = screen.getByRole('checkbox', { name: /邮件/i })
      fireEvent.click(emailCheckbox)

      // 提交表单
      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'New Rule',
          metric: 'RESPONSE_TIME',
          condition: 'GREATER_THAN',
          threshold: 1500,
          duration: 300,
          severity: 'WARNING',
          enabled: true,
          channels: ['email'],
        })
      })
    })

    it('应该在提交失败时显示错误信息', async () => {
      const onSubmit = jest
        .fn()
        .mockRejectedValue(new Error('Failed to save rule'))

      render(<AlertRuleForm onSubmit={onSubmit} />)

      // 填写并提交表单
      fireEvent.change(screen.getByLabelText(/规则名称/i), {
        target: { value: 'New Rule' },
      })
      fireEvent.change(screen.getByLabelText(/阈值/i), {
        target: { value: '1000' },
      })
      const emailCheckbox = screen.getByRole('checkbox', { name: /邮件/i })
      fireEvent.click(emailCheckbox)

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to save rule/i)).toBeInTheDocument()
      })
    })

    it('应该在提交时禁用按钮', async () => {
      const onSubmit = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        )

      render(<AlertRuleForm onSubmit={onSubmit} />)

      // 填写表单
      fireEvent.change(screen.getByLabelText(/规则名称/i), {
        target: { value: 'New Rule' },
      })
      fireEvent.change(screen.getByLabelText(/阈值/i), {
        target: { value: '1000' },
      })
      const emailCheckbox = screen.getByRole('checkbox', { name: /邮件/i })
      fireEvent.click(emailCheckbox)

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      // 提交时按钮应该被禁用
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent(/保存中/i)

      // 等待提交完成
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('监控指标选择', () => {
    it('应该显示所有可用的监控指标', () => {
      render(<AlertRuleForm />)

      const select = screen.getByLabelText(/监控指标/i)
      fireEvent.click(select)

      expect(screen.getByRole('option', { name: /响应时间/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /QPS/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /CPU使用率/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /内存使用/i })).toBeInTheDocument()
    })

    it('应该根据选择的指标显示对应的单位', () => {
      render(<AlertRuleForm />)

      const metricSelect = screen.getByLabelText(/监控指标/i)

      // 选择响应时间
      fireEvent.change(metricSelect, { target: { value: 'RESPONSE_TIME' } })
      expect(screen.getByText(/毫秒/i)).toBeInTheDocument()

      // 选择内存使用
      fireEvent.change(metricSelect, { target: { value: 'MEMORY_USAGE' } })
      expect(screen.getByText(/MB/i)).toBeInTheDocument()
    })
  })

  describe('启用/禁用开关', () => {
    it('应该显示启用开关', () => {
      render(<AlertRuleForm />)

      const enableSwitch = screen.getByRole('checkbox', { name: /启用规则/i })
      expect(enableSwitch).toBeInTheDocument()
    })

    it('应该默认为启用状态', () => {
      render(<AlertRuleForm />)

      const enableSwitch = screen.getByRole('checkbox', {
        name: /启用规则/i,
      }) as HTMLInputElement
      expect(enableSwitch.checked).toBe(true)
    })

    it('应该能够切换启用状态', () => {
      render(<AlertRuleForm />)

      const enableSwitch = screen.getByRole('checkbox', {
        name: /启用规则/i,
      }) as HTMLInputElement

      expect(enableSwitch.checked).toBe(true)

      fireEvent.click(enableSwitch)
      expect(enableSwitch.checked).toBe(false)

      fireEvent.click(enableSwitch)
      expect(enableSwitch.checked).toBe(true)
    })
  })

  describe('取消操作', () => {
    it('应该在点击取消时调用回调', () => {
      const onCancel = jest.fn()

      render(<AlertRuleForm onCancel={onCancel} />)

      const cancelButton = screen.getByRole('button', { name: /取消/i })
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('应该在取消时重置表单', () => {
      render(<AlertRuleForm />)

      // 填写表单
      const nameInput = screen.getByLabelText(/规则名称/i) as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'Test' } })
      expect(nameInput.value).toBe('Test')

      // 点击取消
      const cancelButton = screen.getByRole('button', { name: /取消/i })
      fireEvent.click(cancelButton)

      // 表单应该被重置
      expect(nameInput.value).toBe('')
    })
  })

  describe('辅助功能(A11y)', () => {
    it('应该有合适的表单标签', () => {
      render(<AlertRuleForm />)

      expect(screen.getByLabelText(/规则名称/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/阈值/i)).toHaveAttribute('required')
    })

    it('应该在验证错误时设置aria-invalid', async () => {
      render(<AlertRuleForm />)

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/规则名称/i)
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('应该有合适的aria-describedby用于错误提示', async () => {
      render(<AlertRuleForm />)

      const submitButton = screen.getByRole('button', { name: /保存规则/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/规则名称/i)
        const describedBy = nameInput.getAttribute('aria-describedby')
        expect(describedBy).toBeTruthy()
      })
    })
  })
})
