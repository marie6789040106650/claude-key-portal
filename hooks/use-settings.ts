/**
 * 通用设置管理 Hook
 * Sprint 14 - Phase 7 🔵 REFACTOR
 *
 * 提供通用的设置获取和更新功能
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

interface UseSettingsOptions<T> {
  /**
   * 查询键，用于React Query缓存
   */
  queryKey: string[]
  /**
   * API端点路径
   */
  endpoint: string
  /**
   * 成功提示消息
   */
  successMessage?: string
  /**
   * 失败提示消息
   */
  errorMessage?: string
}

/**
 * 通用设置管理 Hook
 *
 * @template T - 设置数据类型
 * @param {UseSettingsOptions<T>} options - Hook配置选项
 * @returns {object} 包含设置数据和操作方法
 * @property {T | null} settings - 设置数据
 * @property {T | null} localSettings - 本地设置状态（用于乐观更新）
 * @property {function} setLocalSettings - 更新本地设置
 * @property {boolean} isLoading - 是否正在加载
 * @property {boolean} isError - 是否加载失败
 * @property {function} updateSettings - 更新设置的方法
 * @property {boolean} isUpdating - 是否正在更新
 * @property {boolean} isSuccess - 是否更新成功
 *
 * @example
 * // 使用示例：通知设置
 * const {
 *   localSettings,
 *   setLocalSettings,
 *   isLoading,
 *   updateSettings,
 *   isUpdating,
 *   isSuccess
 * } = useSettings<NotificationConfig>({
 *   queryKey: ['notificationConfig'],
 *   endpoint: '/api/user/notifications',
 *   successMessage: '保存成功',
 *   errorMessage: '保存失败'
 * })
 */
export function useSettings<T>({
  queryKey,
  endpoint,
  successMessage = '保存成功',
  errorMessage = '保存失败',
}: UseSettingsOptions<T>) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState<T | null>(null)

  // 获取设置
  const { data: settings, isLoading, isError } = useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Failed to load settings')
      return response.json()
    },
  })

  // 同步服务器设置到本地状态
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  // 更新设置
  const mutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      // 恢复到服务器状态
      setLocalSettings(settings!)
    },
  })

  // 处理成功/失败状态
  useEffect(() => {
    if (mutation.isSuccess) {
      toast({
        title: successMessage,
      })
    }
  }, [mutation.isSuccess, toast, successMessage])

  useEffect(() => {
    if (mutation.isError) {
      toast({
        title: errorMessage,
        variant: 'destructive',
      })
    }
  }, [mutation.isError, toast, errorMessage])

  return {
    settings,
    localSettings,
    setLocalSettings,
    isLoading,
    isError,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
  }
}
