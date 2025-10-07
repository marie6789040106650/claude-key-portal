/**
 * AlertRuleForm - 告警规则配置表单组件
 *
 * 用于创建和编辑告警规则
 */

'use client'

import { useState, useEffect } from 'react'
import { MetricType, AlertCondition, AlertSeverity } from '@prisma/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

interface AlertRule {
  id: string
  name: string
  metric: MetricType
  condition: AlertCondition
  threshold: number
  duration: number
  severity: AlertSeverity
  enabled: boolean
  channels: string[]
  createdAt: Date
  updatedAt: Date
}

interface AlertRuleFormProps {
  rule?: AlertRule
  mode?: 'create' | 'edit'
  onSubmit?: (data: any) => Promise<any>
  onCancel?: () => void
}

const metricUnits = {
  RESPONSE_TIME: '毫秒 (ms)',
  QPS: '请求/秒',
  CPU_USAGE: '百分比 (%)',
  MEMORY_USAGE: 'MB',
  DATABASE_QUERY: '毫秒 (ms)',
  API_SUCCESS_RATE: '百分比 (%)',
}

export function AlertRuleForm({
  rule,
  mode = 'create',
  onSubmit,
  onCancel,
}: AlertRuleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    metric: 'RESPONSE_TIME' as MetricType,
    condition: 'GREATER_THAN' as AlertCondition,
    threshold: 0,
    duration: 300,
    severity: 'WARNING' as AlertSeverity,
    enabled: true,
    channels: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  // 编辑模式下预填充表单
  useEffect(() => {
    if (rule && mode === 'edit') {
      setFormData({
        name: rule.name,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        duration: rule.duration,
        severity: rule.severity,
        enabled: rule.enabled,
        channels: rule.channels,
      })
    }
  }, [rule, mode])

  // 验证表单
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '规则名称不能为空'
    }

    if (formData.threshold <= 0) {
      newErrors.threshold = '阈值必须为正数'
    }

    if (formData.duration <= 0) {
      newErrors.duration = '持续时间必须大于0'
    }

    if (formData.channels.length === 0) {
      newErrors.channels = '至少选择一个通知渠道'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) {
      return
    }

    if (!onSubmit) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error: any) {
      setSubmitError(error.message || '保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    // 重置表单
    setFormData({
      name: '',
      metric: 'RESPONSE_TIME',
      condition: 'GREATER_THAN',
      threshold: 0,
      duration: 300,
      severity: 'WARNING',
      enabled: true,
      channels: [],
    })
    setErrors({})
    setSubmitError('')
    onCancel?.()
  }

  // 处理通知渠道变化
  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        channels: [...prev.channels, channel],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        channels: prev.channels.filter((c) => c !== channel),
      }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? '编辑告警规则' : '告警规则配置'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              规则名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：高响应时间告警"
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* 监控指标 */}
          <div className="space-y-2">
            <Label htmlFor="metric">监控指标</Label>
            <Select
              value={formData.metric}
              onValueChange={(value) =>
                setFormData({ ...formData, metric: value as MetricType })
              }
            >
              <SelectTrigger id="metric" aria-label="监控指标">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESPONSE_TIME">响应时间</SelectItem>
                <SelectItem value="QPS">QPS</SelectItem>
                <SelectItem value="CPU_USAGE">CPU使用率</SelectItem>
                <SelectItem value="MEMORY_USAGE">内存使用</SelectItem>
                <SelectItem value="DATABASE_QUERY">数据库查询</SelectItem>
                <SelectItem value="API_SUCCESS_RATE">API成功率</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              单位: {metricUnits[formData.metric]}
            </p>
          </div>

          {/* 条件和阈值 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">条件</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) =>
                  setFormData({ ...formData, condition: value as AlertCondition })
                }
              >
                <SelectTrigger id="condition" aria-label="条件">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GREATER_THAN">大于</SelectItem>
                  <SelectItem value="LESS_THAN">小于</SelectItem>
                  <SelectItem value="EQUAL_TO">等于</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">
                阈值 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="threshold"
                type="number"
                value={formData.threshold}
                onChange={(e) =>
                  setFormData({ ...formData, threshold: parseFloat(e.target.value) })
                }
                placeholder="1000"
                required
                aria-invalid={!!errors.threshold}
              />
              {errors.threshold && (
                <p className="text-sm text-red-600">{errors.threshold}</p>
              )}
            </div>
          </div>

          {/* 持续时间 */}
          <div className="space-y-2">
            <Label htmlFor="duration">
              持续时间（秒） <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
              placeholder="300"
              required
              aria-invalid={!!errors.duration}
            />
            {errors.duration && (
              <p className="text-sm text-red-600">{errors.duration}</p>
            )}
            <p className="text-xs text-gray-500">
              告警条件需持续满足的时间
            </p>
          </div>

          {/* 严重程度 */}
          <div className="space-y-2">
            <Label htmlFor="severity">严重程度</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) =>
                setFormData({ ...formData, severity: value as AlertSeverity })
              }
            >
              <SelectTrigger id="severity" aria-label="严重程度">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">信息</SelectItem>
                <SelectItem value="WARNING">警告</SelectItem>
                <SelectItem value="ERROR">错误</SelectItem>
                <SelectItem value="CRITICAL">严重</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 通知渠道 */}
          <div className="space-y-2">
            <Label aria-label="通知渠道">
              通知渠道 <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-email"
                  checked={formData.channels.includes('email')}
                  onCheckedChange={(checked) =>
                    handleChannelChange('email', checked as boolean)
                  }
                />
                <Label htmlFor="channel-email" className="font-normal cursor-pointer">
                  邮件
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-webhook"
                  checked={formData.channels.includes('webhook')}
                  onCheckedChange={(checked) =>
                    handleChannelChange('webhook', checked as boolean)
                  }
                />
                <Label htmlFor="channel-webhook" className="font-normal cursor-pointer">
                  Webhook
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-system"
                  checked={formData.channels.includes('system')}
                  onCheckedChange={(checked) =>
                    handleChannelChange('system', checked as boolean)
                  }
                />
                <Label htmlFor="channel-system" className="font-normal cursor-pointer">
                  系统通知
                </Label>
              </div>
            </div>
            {errors.channels && (
              <p className="text-sm text-red-600">{errors.channels}</p>
            )}
          </div>

          {/* 启用规则 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              启用规则
            </Label>
          </div>

          {/* 错误提示 */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center space-x-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存规则'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
