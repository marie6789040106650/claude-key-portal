/**
 * 安全设置标签组件
 * Sprint 14 - Phase 5 🟢 GREEN
 */

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { UserSession } from '@/types/user'

// 密码强度计算函数
function calculatePasswordStrength(password: string): '弱' | '中' | '强' {
  if (!password) return '弱'

  let strength = 0

  // 长度
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++

  // 包含小写字母
  if (/[a-z]/.test(password)) strength++

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++

  // 包含数字
  if (/\d/.test(password)) strength++

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  if (strength <= 2) return '弱'
  if (strength <= 4) return '中'
  return '强'
}

// 密码表单验证 schema
const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
        '密码必须包含大小写字母、数字和特殊字符'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function SecurityTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // 获取活跃会话列表
  const { data: sessions = [] } = useQuery<UserSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('/api/user/sessions')
      if (!response.ok) throw new Error('Failed to load sessions')
      return response.json()
    },
  })

  // 修改密码
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '旧密码错误')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: '密码已更新',
        description: '密码修改成功',
      })
      form.reset()
      setNewPassword('')
    },
  })

  // 删除会话
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
      setSessionToDelete(null)
    },
  })

  // 删除所有其他设备
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
  })

  // 表单设置
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onChange',
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    })
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  return (
    <div className="space-y-8">
      {/* 密码修改部分 */}
      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>
            至少8个字符，包含大小写字母、数字和特殊字符
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordMutation.isError && (
            <div className="mb-4 text-sm text-destructive">
              {passwordMutation.error?.message}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前密码</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        disabled={passwordMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={field.name}>新密码</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
                        disabled={passwordMutation.isLoading}
                        onChange={(e) => {
                          field.onChange(e)
                          setNewPassword(e.target.value)
                        }}
                      />
                    </FormControl>
                    {newPassword && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>密码强度:</span>
                        <span
                          data-testid="password-strength"
                          className={
                            passwordStrength === '强'
                              ? 'text-green-600'
                              : passwordStrength === '中'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }
                        >
                          {passwordStrength}
                        </span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={field.name}>
                      确认新密码
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
                        disabled={passwordMutation.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={passwordMutation.isLoading || !form.formState.isValid}
              >
                {passwordMutation.isLoading ? '更新中...' : '更新密码'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 会话管理部分 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃会话</CardTitle>
          <CardDescription>管理您的登录设备</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {session.device} - {session.browser}
                  </span>
                  {session.isCurrent && (
                    <Badge variant="default">当前设备</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.location} · {session.ip}
                </div>
                <div className="text-xs text-muted-foreground">
                  最后活跃: {new Date(session.lastActiveAt).toLocaleString()}
                </div>
              </div>

              {!session.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionToDelete(session.id)}
                >
                  注销
                </Button>
              )}
            </div>
          ))}

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={deleteAllSessionsMutation.isLoading}
            >
              注销所有其他设备
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 删除会话确认对话框 */}
      <Dialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认注销此设备？</DialogTitle>
            <DialogDescription>
              此操作将注销该设备的登录状态，您需要重新登录。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (sessionToDelete) {
                  deleteSessionMutation.mutate(sessionToDelete)
                }
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除所有其他设备确认对话框 */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认注销所有其他设备？</DialogTitle>
            <DialogDescription>
              此操作将注销所有其他设备的登录状态。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteAllSessionsMutation.mutate('all')
                setShowDeleteAllDialog(false)
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
