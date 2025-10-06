/**
 * 用户资料管理 Hook
 * Sprint 14 - Phase 7 🔵 REFACTOR
 *
 * 提供用户资料的获取和更新功能
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import type { UserProfile } from '@/types/user'

interface UpdateProfileData {
  nickname?: string
  bio?: string
}

/**
 * 用户资料管理 Hook
 *
 * @returns {object} 包含用户资料数据和更新方法
 * @property {UserProfile | undefined} profile - 用户资料数据
 * @property {boolean} isLoading - 是否正在加载
 * @property {boolean} isError - 是否加载失败
 * @property {function} updateProfile - 更新用户资料的方法
 * @property {boolean} isUpdating - 是否正在更新
 */
export function useUserProfile() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 获取用户资料
  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to load profile')
      return response.json()
    },
  })

  // 更新用户资料
  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({
        title: '保存成功',
      })
    },
    onError: () => {
      toast({
        title: '保存失败',
        variant: 'destructive',
      })
    },
  })

  return {
    profile,
    isLoading,
    isError,
    updateProfile: mutation.mutate,
    isUpdating: mutation.isLoading,
  }
}
