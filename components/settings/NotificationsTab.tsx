/**
 * 通知设置标签组件
 * Sprint 14 - Phase 6 🟢 GREEN
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import type { NotificationConfig } from '@/types/settings'

const NOTIFICATION_TYPES = [
  { key: 'KEY_CREATED', label: '密钥创建通知', description: '创建新密钥时通知您' },
  { key: 'KEY_DELETED', label: '密钥删除通知', description: '删除密钥时通知您' },
  { key: 'USAGE_WARNING', label: '使用量告警', description: '使用量接近配额时通知您' },
  { key: 'SECURITY_ALERT', label: '安全告警', description: '检测到安全风险时通知您' },
  { key: 'SYSTEM_UPDATE', label: '产品更新通知', description: '系统更新和新功能通知' },
] as const

const NOTIFICATION_CHANNELS = [
  { key: 'email', label: '邮件通知', description: '通过邮件接收通知' },
  { key: 'webhook', label: 'Webhook通知', description: '通过Webhook接收通知' },
  { key: 'system', label: '系统通知', description: '在系统内显示通知' },
] as const

export function NotificationsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [localConfig, setLocalConfig] = useState<NotificationConfig | null>(null)

  // 获取通知配置
  const { data: config, isLoading } = useQuery<NotificationConfig>({
    queryKey: ['notificationConfig'],
    queryFn: async () => {
      const response = await fetch('/api/user/notifications')
      if (!response.ok) throw new Error('Failed to load config')
      return response.json()
    },
  })

  // 同步配置到本地状态
  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  // 更新通知配置
  const mutation = useMutation({
    mutationFn: async (newConfig: Partial<NotificationConfig>) => {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfig'] })
    },
    onError: () => {
      // 恢复到服务器状态
      setLocalConfig(config!)
    },
  })

  // 处理成功/失败状态
  useEffect(() => {
    if (mutation.isSuccess) {
      toast({
        title: '保存成功',
      })
    }
  }, [mutation.isSuccess, toast])

  useEffect(() => {
    if (mutation.isError) {
      toast({
        title: '保存失败',
        variant: 'destructive',
      })
    }
  }, [mutation.isError, toast])

  // 加载中状态
  if (isLoading) {
    return (
      <div data-testid="notifications-skeleton" className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!localConfig) return null

  const handleTypeToggle = (typeKey: string, value: boolean) => {
    // 乐观更新本地状态
    setLocalConfig({
      ...localConfig,
      types: {
        ...localConfig.types,
        [typeKey]: value,
      },
    })

    // 只发送改变的字段
    mutation.mutate({
      types: {
        [typeKey]: value,
      },
    })
  }

  const handleChannelToggle = (channelKey: string, value: boolean) => {
    // 乐观更新本地状态
    setLocalConfig({
      ...localConfig,
      channels: {
        ...localConfig.channels,
        [channelKey]: value,
      },
    })

    // 只发送改变的字段
    mutation.mutate({
      channels: {
        [channelKey]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>通知设置</CardTitle>
          <CardDescription>选择您希望接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_TYPES.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="space-y-0.5">
                <Label htmlFor={key}>{label}</Label>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
              <Switch
                id={key}
                checked={localConfig.types[key as keyof typeof localConfig.types]}
                onCheckedChange={(checked) => handleTypeToggle(key, checked)}
                disabled={mutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知渠道</CardTitle>
          <CardDescription>选择接收通知的方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_CHANNELS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="space-y-0.5">
                <Label htmlFor={key}>{label}</Label>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
              <Switch
                id={key}
                checked={localConfig.channels[key as keyof typeof localConfig.channels]}
                onCheckedChange={(checked) => handleChannelToggle(key, checked)}
                disabled={mutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
