/**
 * TagSelector 组件
 * P1 阶段 - 标签功能 🟢 GREEN
 *
 * 用于选择和管理密钥标签的组件
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

interface TagSelectorProps {
  keyId: string
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  maxLength?: number
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
]

export function TagSelector({
  keyId,
  selectedTags,
  onChange,
  maxTags = 10,
  maxLength = 50,
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  const isMaxTagsReached = selectedTags.length >= maxTags

  // 获取标签建议
  useEffect(() => {
    if (!showSuggestions) return

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error)
      }
    }

    fetchSuggestions()
  }, [showSuggestions])

  const filteredSuggestions = suggestions
    .filter((tag) => !selectedTags.includes(tag))
    .filter((tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase())
    )

  const addTag = useCallback(
    async (tag: string) => {
      const trimmedTag = tag.trim()

      if (!trimmedTag) return

      if (trimmedTag.length > maxLength) {
        toast({
          title: `标签最多 ${maxLength} 个字符`,
          variant: 'destructive',
        })
        return
      }

      if (selectedTags.includes(trimmedTag)) {
        toast({
          title: '标签已存在',
          variant: 'destructive',
        })
        return
      }

      if (isMaxTagsReached) {
        toast({
          title: `最多只能添加 ${maxTags} 个标签`,
          variant: 'destructive',
        })
        return
      }

      setLoading(true)

      try {
        const response = await fetch(`/api/keys/${keyId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: trimmedTag }),
        })

        if (!response.ok) {
          throw new Error('Failed to add tag')
        }

        const data = await response.json()
        onChange(data.tags)
        setInputValue('')
        setShowSuggestions(false)

        toast({
          title: '标签添加成功',
        })
      } catch (error) {
        toast({
          title: '添加标签失败',
          variant: 'destructive',
        })
        console.error('Failed to add tag:', error)
      } finally {
        setLoading(false)
      }
    },
    [keyId, selectedTags, maxTags, maxLength, isMaxTagsReached, onChange]
  )

  const removeTag = useCallback(
    async (tag: string) => {
      setLoading(true)

      try {
        const response = await fetch(`/api/keys/${keyId}/tags`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag }),
        })

        if (!response.ok) {
          throw new Error('Failed to remove tag')
        }

        const data = await response.json()
        onChange(data.tags)

        toast({
          title: '标签已删除',
        })
      } catch (error) {
        toast({
          title: '删除标签失败',
          variant: 'destructive',
        })
        console.error('Failed to remove tag:', error)
      } finally {
        setLoading(false)
      }
    },
    [keyId, onChange]
  )

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    }
  }

  const getTagColor = (index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length]
  }

  return (
    <div data-testid="tag-selector" className="space-y-4">
      <Label htmlFor="tag-input">标签</Label>

      {/* 已选标签 */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-gray-500">暂无标签</span>
        ) : (
          selectedTags.map((tag, index) => (
            <Badge
              key={tag}
              data-testid="tag-item"
              variant="secondary"
              className={`${getTagColor(index)} rounded-full`}
            >
              {tag}
              <Button
                data-testid="delete-tag-button"
                variant="ghost"
                size="sm"
                onClick={() => removeTag(tag)}
                disabled={loading}
                aria-label={`删除标签 ${tag}`}
                className="ml-1 h-4 w-4 p-0 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>

      {/* 输入框 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            id="tag-input"
            data-testid="tag-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder="添加标签..."
            disabled={isMaxTagsReached}
            maxLength={maxLength}
            aria-label="标签"
          />
          <Button
            data-testid="add-tag-button"
            onClick={() => addTag(inputValue)}
            disabled={loading || !inputValue.trim() || isMaxTagsReached}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 建议列表 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  addTag(tag)
                  setShowSuggestions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMaxTagsReached && (
        <p className="text-sm text-amber-600">
          最多只能添加 {maxTags} 个标签
        </p>
      )}
    </div>
  )
}
