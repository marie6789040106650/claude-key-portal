'use client'

/**
 * 安装指导页面
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { PlatformSelector } from '@/components/install/PlatformSelector'
import { ScriptDisplay } from '@/components/install/ScriptDisplay'
import { InstallSteps } from '@/components/install/InstallSteps'

type Platform = 'macos' | 'windows' | 'linux'
type Environment = 'bash' | 'zsh' | 'powershell'

interface ApiKey {
  id: string
  name: string
  crsKey: string
  status: string
  createdAt: string
}

interface ScriptResponse {
  platform: Platform
  environment: Environment
  envVars: string
  codexConfig: string
  instructions: string[]
}

export default function InstallPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('macos')
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('zsh')
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')

  // 检测用户平台
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) {
      setSelectedPlatform('windows')
      setSelectedEnvironment('powershell')
    } else if (userAgent.includes('mac')) {
      setSelectedPlatform('macos')
      setSelectedEnvironment('zsh')
    } else if (userAgent.includes('linux')) {
      setSelectedPlatform('linux')
      setSelectedEnvironment('bash')
    }
  }, [])

  // 获取用户密钥列表
  const { data: keysData, isLoading: keysLoading, error: keysError } = useQuery({
    queryKey: ['install-keys'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('加载密钥失败')
      }

      const data = await response.json()
      return data.keys as ApiKey[]
    },
  })

  // 默认选中第一个密钥
  useEffect(() => {
    if (keysData && keysData.length > 0 && !selectedKeyId) {
      setSelectedKeyId(keysData[0].id)
    }
  }, [keysData, selectedKeyId])

  // 生成安装脚本
  const { data: scriptData, isPending: scriptLoading, mutate: generateScript } = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/install/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          keyId: selectedKeyId,
          platform: selectedPlatform,
          environment: selectedEnvironment,
        }),
      })

      if (!response.ok) {
        throw new Error('生成脚本失败')
      }

      return await response.json() as ScriptResponse
    },
    onError: (error: Error) => {
      toast({
        title: '错误',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // 当选择变化时重新生成脚本
  useEffect(() => {
    if (selectedKeyId && selectedPlatform && selectedEnvironment) {
      generateScript()
    }
  }, [selectedKeyId, selectedPlatform, selectedEnvironment, generateScript])

  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform)
    // 根据平台设置默认环境
    if (platform === 'windows') {
      setSelectedEnvironment('powershell')
    } else if (platform === 'macos') {
      setSelectedEnvironment('zsh')
    } else {
      setSelectedEnvironment('bash')
    }
  }

  if (keysLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (keysError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">加载密钥失败，请刷新重试</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="install-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">安装指导</h1>
        <p className="mt-2 text-gray-600">
          按照以下步骤配置您的开发环境，开始使用 Claude Key Portal
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：配置选择 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 平台选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择平台</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformSelector
                selected={selectedPlatform}
                onChange={handlePlatformChange}
              />
            </CardContent>
          </Card>

          {/* 密钥选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择密钥</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {keysData && keysData.length > 0 ? (
                keysData.map((key) => (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKeyId(key.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedKeyId === key.id
                        ? 'border-blue-500 bg-blue-50 selected'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {key.crsKey.substring(0, 20)}...
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">暂无可用密钥</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：脚本和步骤 */}
        <div className="lg:col-span-2 space-y-6">
          {scriptLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </CardContent>
            </Card>
          ) : scriptData ? (
            <>
              <ScriptDisplay
                envVars={scriptData.envVars}
                codexConfig={scriptData.codexConfig}
                platform={scriptData.platform}
              />

              <InstallSteps
                instructions={scriptData.instructions}
                platform={scriptData.platform}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  请选择平台和密钥以生成安装脚本
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
