/**
 * 脚本展示组件
 * Sprint MVP - Phase 2 🟢 GREEN
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ScriptDisplayProps {
  envVars: string
  codexConfig: string
  platform: string
}

export function ScriptDisplay({ envVars, codexConfig, platform }: ScriptDisplayProps) {
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(envVars)
      setCopiedEnv(true)
      toast({
        title: '复制成功',
        description: '环境变量已复制到剪贴板',
      })
      setTimeout(() => setCopiedEnv(false), 2000)
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制',
        variant: 'destructive',
      })
    }
  }

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(codexConfig)
      setCopiedConfig(true)
      toast({
        title: '复制成功',
        description: 'Codex配置已复制到剪贴板',
      })
      setTimeout(() => setCopiedConfig(false), 2000)
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* 环境变量配置 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>环境变量配置</CardTitle>
          <Button
            size="sm"
            variant="outline"
            role="button"
            aria-label="复制"
            onClick={handleCopyEnv}
          >
            {copiedEnv ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedEnv ? '已复制' : '复制'}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{envVars}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Codex配置 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Codex 配置文件</CardTitle>
          <Button
            size="sm"
            variant="outline"
            role="button"
            aria-label="复制"
            onClick={handleCopyConfig}
          >
            {copiedConfig ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedConfig ? '已复制' : '复制'}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{codexConfig}</code>
          </pre>
        </CardContent>
      </Card>
    </>
  )
}
