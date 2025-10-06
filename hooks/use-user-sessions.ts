/**
 * 用户会话管理 Hook
 * Sprint 14 - Phase 7 🔵 REFACTOR
 *
 * 提供会话列表的获取和删除功能
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import type { UserSession } from '@/types/user'

/**
 * 用户会话管理 Hook
 *
 * @returns {object} 包含会话数据和操作方法
 * @property {UserSession[]} sessions - 会话列表
 * @property {boolean} isLoading - 是否正在加载
 * @property {boolean} isError - 是否加载失败
 * @property {function} deleteSession - 删除单个会话的方法
 * @property {function} deleteAllOtherSessions - 删除所有其他设备会话的方法
 * @property {boolean} isDeleting - 是否正在删除会话
 */
export function useUserSessions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 获取会话列表
  const { data: sessions = [], isLoading, isError } = useQuery<UserSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('/api/user/sessions')
      if (!response.ok) throw new Error('Failed to load sessions')
      return response.json()
    },
  })

  // 删除单个会话
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete session')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: '会话已注销',
      })
    },
    onError: () => {
      toast({
        title: '注销失败',
        variant: 'destructive',
      })
    },
  })

  // 删除所有其他设备会话
  const deleteAllSessionsMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch('/api/user/sessions/others', {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete sessions')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast({
        title: '所有其他设备已注销',
      })
    },
    onError: () => {
      toast({
        title: '注销失败',
        variant: 'destructive',
      })
    },
  })

  return {
    sessions,
    isLoading,
    isError,
    deleteSession: deleteSessionMutation.mutate,
    deleteAllOtherSessions: deleteAllSessionsMutation.mutate,
    isDeleting: deleteSessionMutation.isPending || deleteAllSessionsMutation.isPending,
  }
}
