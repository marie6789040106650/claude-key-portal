/**
 * 到期提醒设置标签组件
 * Sprint 14 - Phase 6 🟢 GREEN
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Plus } from 'lucide-react'
import type { ExpirationSettings } from '@/types/settings'

export function ExpirationTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState<ExpirationSettings | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})

  // 获取到期设置
  const { data, isPending, isError, error } = useQuery<ExpirationSettings>({
    queryKey: ['expirationSettings'],
    queryFn: async () => {
      const response = await fetch('/api/user/expiration')
      if (!response.ok) throw new Error('Failed to load settings')
      return response.json()
    },
  })

  // 同步设置到本地状态
  useEffect(() => {
    if (data) {
      setLocalSettings(data)
    }
  }, [data])

  // 更新设置
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<ExpirationSettings>) => {
      const response = await fetch('/api/user/expiration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expirationSettings'] })
      toast({
        title: '保存成功',
      })
    },
  })

  // 加载中状态
  if (isPending) {
    return (
      <div data-testid="expiration-skeleton" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!localSettings) return null

  const validateDay = (day: number, index: number): boolean => {
    const newErrors = { ...errors }

    if (day < 1 || day > 30) {
      newErrors[index] = '天数必须在1-30之间'
      setErrors(newErrors)
      return false
    }

    delete newErrors[index]
    setErrors(newErrors)
    return true
  }

  const handleDayChange = (index: number, value: string) => {
    const day = parseInt(value)
    if (isNaN(day)) return

    const newDays = [...localSettings.reminderDays]
    newDays[index] = day

    setLocalSettings({
      ...localSettings,
      reminderDays: newDays,
    })

    validateDay(day, index)
  }

  const handleAddDay = () => {
    setLocalSettings({
      ...localSettings,
      reminderDays: [...localSettings.reminderDays, 7],
    })
  }

  const handleRemoveDay = (index: number) => {
    const newDays = localSettings.reminderDays.filter((_, i) => i !== index)
    setLocalSettings({
      ...localSettings,
      reminderDays: newDays,
    })

    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const handleChannelToggle = (channel: string, checked: boolean) => {
    const newChannels = checked
      ? [...localSettings.notifyChannels, channel]
      : localSettings.notifyChannels.filter((c) => c !== channel)

    setLocalSettings({
      ...localSettings,
      notifyChannels: newChannels,
    })
  }

  const handleSave = () => {
    // 验证所有天数
    let hasError = false
    localSettings.reminderDays.forEach((day, index) => {
      if (!validateDay(day, index)) {
        hasError = true
      }
    })

    if (hasError) return

    mutation.mutate({
      reminderDays: localSettings.reminderDays,
      notifyChannels: localSettings.notifyChannels,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>提前提醒天数</CardTitle>
          <CardDescription>设置在密钥到期前多少天提醒您</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localSettings.reminderDays.map((day, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={day}
                  onChange={(e) => handleDayChange(index, e.target.value)}
                  onBlur={() => validateDay(day, index)}
                  className={errors[index] ? 'border-red-500' : ''}
                />
                {errors[index] && (
                  <p className="text-sm text-red-500 mt-1">{errors[index]}</p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">天前</span>
              {localSettings.reminderDays.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDay(index)}
                  aria-label="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDay}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加提醒天数
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>提醒方式</CardTitle>
          <CardDescription>选择接收提醒的渠道</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={localSettings.notifyChannels.includes('email')}
              onCheckedChange={(checked) =>
                handleChannelToggle('email', checked as boolean)
              }
            />
            <Label htmlFor="email" className="font-normal cursor-pointer">
              邮件提醒
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="webhook"
              checked={localSettings.notifyChannels.includes('webhook')}
              onCheckedChange={(checked) =>
                handleChannelToggle('webhook', checked as boolean)
              }
            />
            <Label htmlFor="webhook" className="font-normal cursor-pointer">
              Webhook提醒
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="system"
              checked={localSettings.notifyChannels.includes('system')}
              onCheckedChange={(checked) =>
                handleChannelToggle('system', checked as boolean)
              }
            />
            <Label htmlFor="system" className="font-normal cursor-pointer">
              系统提醒
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={mutation.isPending || Object.keys(errors).length > 0}>
        {mutation.isPending ? '保存中...' : '保存设置'}
      </Button>
    </div>
  )
}
