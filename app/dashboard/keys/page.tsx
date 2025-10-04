'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeysTable } from '@/components/keys/KeysTable'
import { KeyForm } from '@/components/keys/KeyForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ToastContainer, toast } from '@/components/ui/toast-simple'
import { Plus } from 'lucide-react'
import type { ApiKey } from '@/types/keys'

export default function KeysPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isKeyDisplayOpen, setIsKeyDisplayOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [newKeyData, setNewKeyData] = useState<{ name: string; key: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const queryClient = useQueryClient()

  // 获取密钥列表
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['keys'],
    queryFn: async () => {
      const response = await fetch('/api/keys')
      if (!response.ok) {
        throw new Error('加载失败')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
    gcTime: 5 * 60 * 1000, // 缓存5分钟
    refetchOnWindowFocus: true, // 窗口获得焦点时刷新
    refetchOnReconnect: true, // 网络重连时刷新
  })

  // 解构API响应
  const keys = useMemo(() => data?.keys || [], [data?.keys])
  const total = data?.total || 0
  const page = data?.page || 1
  const limit = data?.limit || 10

  // 将错误转换为中文
  const error = queryError ? new Error(
    (queryError as Error).message.includes('Network')
      ? '网络错误'
      : '加载失败'
  ) : null

  // 处理创建密钥
  const handleCreate = useCallback(() => {
    setEditingKey(null)
    setIsFormDialogOpen(true)
  }, [])

  // 处理编辑密钥
  const handleEdit = useCallback((key: ApiKey) => {
    setEditingKey(key)
    setIsFormDialogOpen(true)
  }, [])

  // 处理删除密钥
  const handleDelete = useCallback((key: ApiKey) => {
    setDeletingKey(key)
    setDeleteError(null)
    setIsConfirmDialogOpen(true)
  }, [])

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingKey) return

    setDeleteError(null)

    try {
      const response = await fetch(`/api/keys/${deletingKey.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        setDeleteError(errorData.error || '删除失败')
        return
      }

      // 刷新列表
      await refetch()

      // 关闭对话框
      setIsConfirmDialogOpen(false)
      setDeletingKey(null)
    } catch (error) {
      setDeleteError('删除失败')
    }
  }, [deletingKey, refetch])

  // 取消删除
  const handleCancelDelete = useCallback(() => {
    setIsConfirmDialogOpen(false)
    setDeletingKey(null)
    setDeleteError(null)
  }, [])

  // 复制密钥
  const handleCopy = useCallback(async (keyId: string) => {
    const key = keys.find((k) => k.id === keyId)
    if (!key) return

    try {
      await navigator.clipboard.writeText(key.keyMasked)
      toast(`已复制: ${key.keyMasked}`, 'success', 2000)
    } catch (error) {
      toast('复制失败，请手动复制', 'error')
    }
  }, [keys])

  // 表单提交成功
  const handleFormSuccess = useCallback(async (result: any) => {
    // 刷新列表
    await refetch()
    // 关闭表单对话框
    setIsFormDialogOpen(false)
    setEditingKey(null)

    // 如果是创建操作且返回了完整密钥，显示密钥对话框
    if (result?.key?.keyValue) {
      setNewKeyData({
        name: result.key.name,
        key: result.key.keyValue,
      })
      setIsKeyDisplayOpen(true)
    }
  }, [refetch])

  // 取消表单
  const handleFormCancel = useCallback(() => {
    setIsFormDialogOpen(false)
    setEditingKey(null)
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <ToastContainer />
      {/* 页面标题和操作栏 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">密钥管理</h1>
        <Button data-testid="create-key-button" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建密钥
        </Button>
      </div>

      {/* 密钥表格 */}
      <KeysTable
        keys={keys}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onRetry={refetch}
        loading={isLoading}
        error={error as Error | null}
        filterable
        searchable
      />

      {/* 创建/编辑表单对话框 */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent data-testid="key-form-dialog" className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              密钥管理表单
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingKey ? '编辑现有密钥的信息' : '创建一个新的 API 密钥'}
            </DialogDescription>
          </DialogHeader>
          <KeyForm
            mode={editingKey ? 'edit' : 'create'}
            initialData={editingKey || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      {isConfirmDialogOpen && (
        <div
          data-testid="confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">确认删除</h2>
            <p className="mb-6">
              确定要删除密钥 <span className="font-semibold">{deletingKey?.name}</span> 吗？此操作无法撤销。
            </p>

            {deleteError && (
              <div className="mb-4 bg-destructive/10 text-destructive px-4 py-3 rounded">
                {deleteError}
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <Button
                data-testid="cancel-delete-button"
                variant="outline"
                onClick={handleCancelDelete}
              >
                取消
              </Button>
              <Button
                data-testid="confirm-delete-button"
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 显示新创建的完整密钥对话框 */}
      {isKeyDisplayOpen && newKeyData && (
        <div
          data-testid="key-display-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsKeyDisplayOpen(false)
              setNewKeyData(null)
              setCopied(false)
            }
          }}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">✅ 密钥创建成功</h2>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ 重要提示
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                请妥善保管此密钥，它只会显示一次！离开此页面后将无法再次查看完整密钥。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">密钥名称</label>
                <p className="text-lg font-semibold">{newKeyData.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">完整密钥</label>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 bg-muted px-4 py-3 rounded font-mono text-sm break-all">
                    {newKeyData.key}
                  </code>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(newKeyData.key)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch (error) {
                        toast('复制失败，请手动复制', 'error')
                      }
                    }}
                    variant={copied ? "default" : "outline"}
                  >
                    {copied ? '✓ 已复制' : '复制'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => {
                  setIsKeyDisplayOpen(false)
                  setNewKeyData(null)
                  setCopied(false)
                }}
              >
                我已保存，关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
