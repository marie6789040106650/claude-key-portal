/**
 * CRS Status Alert Component
 * 当CRS服务不可用时显示警告提示
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface CrsStatusAlertProps {
  /** CRS警告消息 */
  warning?: string
  /** 重试回调 */
  onRetry: () => void
  /** 是否正在重试 */
  retrying?: boolean
}

export function CrsStatusAlert({
  warning,
  onRetry,
  retrying = false,
}: CrsStatusAlertProps) {
  if (!warning) return null

  return (
    <Alert
      data-testid="crs-status-alert"
      variant="warning"
      className="mb-6 border-warning bg-warning/10"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>CRS服务状态</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">{warning}</span>
        <Button
          data-testid="retry-crs-button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={retrying}
          className="ml-4 shrink-0"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${retrying ? 'animate-spin' : ''}`}
          />
          {retrying ? '重试中...' : '重试'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
