'use client'

import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeysTable } from '@/components/keys/KeysTable'
import { KeyForm } from '@/components/keys/KeyForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import type { ApiKey } from '@/types/keys'

export default function KeysPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // 获取密钥列表
  const {
    data: keys = [],
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
  })

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
    // 这里应该复制实际的密钥值
    // 但由于我们只存储了 keyMasked，所以这里只是一个占位符
    console.log('Copy key:', keyId)
  }, [])

  // 表单提交成功
  const handleFormSuccess = useCallback(async () => {
    // 刷新列表
    await refetch()
    // 关闭对话框
    setIsFormDialogOpen(false)
    setEditingKey(null)
  }, [refetch])

  // 取消表单
  const handleFormCancel = useCallback(() => {
    setIsFormDialogOpen(false)
    setEditingKey(null)
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full"
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
    </div>
  )
}
