/**
 * useMediaQuery Hook
 * 用于检测媒体查询是否匹配
 */

'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      return
    }

    // 创建媒体查询
    const media = window.matchMedia(query)

    // 设置初始值
    setMatches(media.matches)

    // 监听变化
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 添加监听器
    media.addEventListener('change', listener)

    // 清理函数
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}

/**
 * 预定义的响应式breakpoints
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
}

/**
 * 检查是否为小屏幕（< 768px）
 */
export function useIsSmallScreen(): boolean {
  return !useMediaQuery(breakpoints.md)
}
