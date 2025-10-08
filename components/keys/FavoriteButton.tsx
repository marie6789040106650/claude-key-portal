/**
 * FavoriteButton 组件
 * P1 阶段 - 收藏功能 🟢 GREEN
 *
 * 用于切换密钥收藏状态的按钮组件
 */

'use client'

import { useState, useCallback } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface FavoriteButtonProps {
  keyId: string
  isFavorite: boolean
  onToggle: (isFavorite: boolean) => void
}

export function FavoriteButton({
  keyId,
  isFavorite,
  onToggle,
}: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (loading) return

    setLoading(true)
    const newFavoriteStatus = !isFavorite

    try {
      const response = await fetch(`/api/keys/${keyId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }

      const data = await response.json()
      onToggle(data.isFavorite)

      toast({
        title: newFavoriteStatus ? '已添加到收藏' : '已取消收藏',
      })
    } catch (error) {
      toast({
        title: '操作失败，请重试',
        variant: 'destructive',
      })
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoading(false)
    }
  }, [keyId, isFavorite, loading, onToggle])

  return (
    <Button
      data-testid="favorite-button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorite ? '取消收藏' : '收藏'}
      aria-pressed={isFavorite}
      className="hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div
          data-testid="loading-spinner"
          className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
        />
      ) : (
        <Star
          className={`w-4 h-4 lucide-star ${
            isFavorite
              ? 'fill-yellow-400 text-yellow-500'
              : 'text-gray-400'
          }`}
        />
      )}
    </Button>
  )
}
