/**
 * NotesEditor 组件
 * P1 阶段 - 备注功能 🟢 GREEN
 *
 * 用于编辑密钥备注的组件
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Eye, EyeOff } from 'lucide-react'

interface NotesEditorProps {
  keyId: string
  initialValue: string
  onSave: (description: string) => void
  maxLength?: number
  autoSave?: boolean
  supportMarkdown?: boolean
}

export function NotesEditor({
  keyId,
  initialValue,
  onSave,
  maxLength = 1000,
  autoSave = false,
  supportMarkdown = false,
}: NotesEditorProps) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // 自动保存
  useEffect(() => {
    if (!autoSave || value === initialValue) return

    const timer = setTimeout(async () => {
      await handleSave(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [value, autoSave])

  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (loading) return

      setLoading(true)

      try {
        const response = await fetch(`/api/keys/${keyId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: value.trim() }),
        })

        if (!response.ok) {
          throw new Error('Failed to save notes')
        }

        const data = await response.json()
        onSave(data.description)

        toast({
          title: isAutoSave ? '自动保存成功' : '保存成功',
        })
      } catch (error) {
        toast({
          title: '保存失败，请重试',
          variant: 'destructive',
        })
        console.error('Failed to save notes:', error)
      } finally {
        setLoading(false)
      }
    },
    [keyId, value, loading, onSave]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    if (newValue.length <= maxLength) {
      setValue(newValue)
    }
  }

  const charCount = value.length
  const isOverLimit = charCount >= maxLength
  const hasChanges = value.trim() !== initialValue

  return (
    <div data-testid="notes-editor" className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="notes-textarea">备注</Label>
        {supportMarkdown && (
          <Button
            data-testid="preview-button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                编辑
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                预览
              </>
            )}
          </Button>
        )}
      </div>

      {showPreview ? (
        <div
          data-testid="markdown-preview"
          className="p-4 border rounded-lg min-h-[200px] prose prose-sm"
          dangerouslySetInnerHTML={{
            __html: value.replace(/\n/g, '<br />'),
          }}
        />
      ) : (
        <Textarea
          id="notes-textarea"
          data-testid="notes-textarea"
          value={value}
          onChange={handleChange}
          placeholder="添加备注..."
          className="min-h-[200px] resize-none"
          maxLength={maxLength}
        />
      )}

      <div className="flex items-center justify-between">
        <span
          data-testid="char-counter"
          aria-live="polite"
          className={`text-sm ${
            isOverLimit ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {charCount} / {maxLength}
        </span>

        <Button
          data-testid="save-button"
          onClick={() => handleSave(false)}
          disabled={loading || !hasChanges}
          aria-label="保存备注"
        >
          {loading
            ? autoSave && value !== initialValue
              ? '自动保存中...'
              : '保存中...'
            : '保存'}
        </Button>
      </div>
    </div>
  )
}
