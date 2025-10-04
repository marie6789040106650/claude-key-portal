/**
 * React Query Provider
 *
 * 为应用提供数据获取和缓存功能
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据在1分钟内视为新鲜，不会重新获取
            staleTime: 60 * 1000,
            // 缓存数据5分钟
            gcTime: 5 * 60 * 1000,
            // 窗口获得焦点时重新获取数据
            refetchOnWindowFocus: true,
            // 网络重新连接时重新获取数据
            refetchOnReconnect: true,
            // 失败时重试1次
            retry: 1,
            // 重试延迟
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 失败时重试0次
            retry: 0,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
