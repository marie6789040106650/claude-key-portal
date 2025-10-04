'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 200) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type]

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-200',
        bgColor,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {message}
    </div>
  )
}

// Toast 容器组件
export function ToastContainer() {
  return <div id="toast-container" />
}

// 简单的 toast 函数
let toastId = 0
const toasts = new Map<number, () => void>()

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  const id = toastId++
  const container = document.getElementById('toast-container')

  if (!container) {
    console.warn('Toast container not found')
    return
  }

  const toastElement = document.createElement('div')
  container.appendChild(toastElement)

  const handleClose = () => {
    toasts.delete(id)
    container.removeChild(toastElement)
  }

  toasts.set(id, handleClose)

  // 使用 React 渲染 Toast
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(toastElement)
    root.render(
      <Toast message={message} type={type} duration={duration} onClose={handleClose} />
    )
  })
}
