'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Zod 验证 schema
const keyFormSchema = z.object({
  name: z
    .string()
    .min(1, '密钥名称不能为空')
    .min(3, '密钥名称至少需要3个字符')
    .max(100, '密钥名称不能超过100个字符'),
  description: z.string().optional(),
  rateLimit: z
    .number()
    .positive('速率限制必须是正整数')
    .int('速率限制必须是正整数')
    .optional(),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        return new Date(date) > new Date()
      },
      { message: '到期时间必须是未来日期' }
    ),
})

type KeyFormData = z.infer<typeof keyFormSchema>

interface KeyFormProps {
  mode?: 'create' | 'edit'
  initialData?: {
    id: string
    name: string
    description?: string
    rateLimit?: number
    expiresAt?: string
  }
  onSuccess: (data: any) => void
  onCancel: () => void
  loading?: boolean
  resetOnSuccess?: boolean
}

function KeyFormComponent({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
  loading: externalLoading = false,
  resetOnSuccess = false,
}: KeyFormProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    trigger,
  } = useForm<KeyFormData>({
    resolver: zodResolver(keyFormSchema),
    mode: 'all', // 同时支持 onBlur 和 onChange 验证
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      rateLimit: initialData?.rateLimit || undefined,
      expiresAt: initialData?.expiresAt || '',
    },
  })

  const isLoading = externalLoading || internalLoading || isSubmitting

  const onSubmit = useCallback(async (data: KeyFormData) => {
    setApiError(null)
    setInternalLoading(true)

    try {
      // 构建请求 body
      const body: any = {
        name: data.name,
        description: data.description || undefined,
        rateLimit: data.rateLimit || undefined,
        expiresAt: data.expiresAt || undefined,
      }

      // 确定 API 端点和方法
      const url = mode === 'edit' ? `/api/keys/${initialData?.id}` : '/api/keys'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setApiError(errorData.error || '操作失败')
        setInternalLoading(false)
        return
      }

      const result = await response.json()

      // 成功后重置表单（如果需要）
      if (resetOnSuccess) {
        reset()
      }

      setInternalLoading(false)
      onSuccess(result)
    } catch (error) {
      setInternalLoading(false)
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network')) {
          setApiError('网络错误，请检查网络连接')
        } else {
          setApiError(error.message)
        }
      } else {
        setApiError('未知错误')
      }
    }
  }, [mode, initialData?.id, resetOnSuccess, reset, onSuccess])

  const title = mode === 'create' ? '创建新密钥' : '编辑密钥'
  const submitButtonText = mode === 'create' ? '创建密钥' : '保存修改'
  const loadingText = mode === 'create' ? '创建中...' : '保存中...'

  return (
    <form data-testid="key-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      {/* API 错误提示 */}
      {apiError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {apiError}
        </div>
      )}

      {/* 密钥名称 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          密钥名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          disabled={isLoading}
          aria-label="密钥名称"
        />
        <p className="text-sm text-muted-foreground">为密钥设置一个易于识别的名称</p>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <textarea
          id="description"
          {...register('description')}
          disabled={isLoading}
          aria-label="描述"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* 速率限制 */}
      <div className="space-y-2">
        <Label htmlFor="rateLimit">速率限制</Label>
        <Input
          id="rateLimit"
          type="number"
          {...register('rateLimit', {
            setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
          })}
          disabled={isLoading}
          aria-label="速率限制"
        />
        <p className="text-sm text-muted-foreground">
          每分钟最大请求数，留空表示无限制
        </p>
        {errors.rateLimit && (
          <p className="text-sm text-destructive">{errors.rateLimit.message}</p>
        )}
      </div>

      {/* 到期时间 */}
      <div className="space-y-2">
        <Label htmlFor="expiresAt">到期时间</Label>
        <Input
          id="expiresAt"
          type="date"
          {...register('expiresAt')}
          disabled={isLoading}
          aria-label="到期时间"
        />
        {errors.expiresAt && (
          <p className="text-sm text-destructive">{errors.expiresAt.message}</p>
        )}
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4">
        <Button
          data-testid="submit-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? loadingText : submitButtonText}
        </Button>
        <Button
          data-testid="cancel-button"
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </Button>
      </div>
    </form>
  )
}

export const KeyForm = React.memo(KeyFormComponent)
