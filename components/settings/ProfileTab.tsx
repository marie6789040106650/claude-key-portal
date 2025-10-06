/**
 * 个人信息设置标签组件
 * Sprint 14 - Phase 4 🟢 GREEN
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import type { UserProfile } from '@/types/user'

// 表单验证 schema
const profileFormSchema = z.object({
  nickname: z
    .string()
    .min(1, '昵称至少需要1个字符')
    .max(50, '昵称最多50个字符'),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 获取用户资料
  const {
    data: userProfile,
    isPending,
    isError,
    error,
  } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to load profile')
      }
      return response.json()
    },
  })

  // 更新用户资料
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Update failed')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      toast({
        title: '保存成功',
        description: '个人信息已更新',
      })
    },
  })

  // 表单设置
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onBlur', // 失焦时验证
    defaultValues: {
      nickname: userProfile?.nickname || '',
      bio: userProfile?.bio || '',
    },
    values: userProfile
      ? {
          nickname: userProfile.nickname,
          bio: userProfile.bio || '',
        }
      : undefined,
  })

  // 加载中状态
  if (isPending) {
    return (
      <div data-testid="profile-skeleton" className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  // 加载失败状态
  if (isError) {
    return (
      <div className="text-center py-8 text-destructive">
        加载失败，请重试
      </div>
    )
  }

  // 更新失败状态
  if (mutation.isError) {
    return (
      <div className="text-center py-8 text-destructive">
        更新失败，请重试
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  // 提交处理
  const onSubmit = (data: ProfileFormValues) => {
    mutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* 头像区域 */}
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20" data-testid="user-avatar">
          <AvatarImage src={userProfile.avatar} alt={userProfile.nickname} />
          <AvatarFallback>{userProfile.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">
            注册于 {new Date(userProfile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* 个人信息表单 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>昵称</FormLabel>
                <FormControl>
                  <Input {...field} disabled={mutation.isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>邮箱</FormLabel>
            <FormControl>
              <Input value={userProfile.email} disabled />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>个人简介</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={mutation.isPending}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={mutation.isPending || !form.formState.isValid}
          >
            {mutation.isPending ? '保存中...' : '保存'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
