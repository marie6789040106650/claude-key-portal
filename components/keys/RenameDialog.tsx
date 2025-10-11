/**
 * 密钥重命名对话框
 * P3.2 Task 2 - 🟢 GREEN
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ApiKey } from '@/types/keys'

interface RenameDialogProps {
  apiKey: ApiKey | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RenameDialog({ apiKey, open, onClose, onSuccess }: RenameDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 当对话框打开时，设置初始名称
  useEffect(() => {
    if (open && apiKey) {
      setName(apiKey.name)
      setError(null)
    }
  }, [open, apiKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) return

    // 验证输入
    if (!name.trim()) {
      setError('密钥名称不能为空')
      return
    }

    // 如果名称没有变化，直接关闭
    if (name.trim() === apiKey.name) {
      onClose()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/keys/${apiKey.id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '重命名失败')
      }

      // 成功
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重命名失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重命名密钥</DialogTitle>
          <DialogDescription>
            为密钥 <span className="font-mono">{apiKey?.keyMasked || apiKey?.keyPrefix}</span> 设置新名称
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">密钥名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入密钥名称"
                autoFocus
                disabled={loading}
              />
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
