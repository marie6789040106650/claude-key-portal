/**
 * 密钥描述编辑对话框
 * P3.2 Task 3 - 🟢 GREEN
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ApiKey } from '@/types/keys'

interface DescriptionDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DescriptionDialog({
  apiKey,
  open,
  onClose,
  onSuccess,
}: DescriptionDialogProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 当对话框打开时，设置初始描述
  useEffect(() => {
    if (open && apiKey) {
      setDescription(apiKey.description || '')
      setError(null)
    }
  }, [open, apiKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) return

    // 如果描述没有变化，直接关闭
    if (description === (apiKey.description || '')) {
      onClose()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/keys/${apiKey.id}/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新描述失败')
      }

      // 成功
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新描述失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑密钥描述</DialogTitle>
          <DialogDescription>
            为密钥 <span className="font-semibold">{apiKey?.name}</span> 添加或修改描述信息
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入密钥描述（可选）"
                rows={4}
                autoFocus
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                描述信息可以帮助你记住这个密钥的用途
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
