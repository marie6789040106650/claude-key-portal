/**
 * Installation Script Generation API
 * POST /api/install/generate - 生成安装配置脚本
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { generateScript, getInstructions } from '@/lib/script-templates'
import {
  isValidPlatform,
  isValidEnvironment,
  type Platform,
} from '@/lib/platform-detector'

/**
 * 生成平台安装脚本
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求参数
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: '请求格式错误' },
        { status: 400 }
      )
    }

    const { keyId, platform, environment } = body

    // 2. 验证认证（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = user.id

    // 3. 验证必需参数
    if (!keyId) {
      return NextResponse.json(
        { error: '缺少必需参数: keyId' },
        { status: 400 }
      )
    }

    if (!platform) {
      return NextResponse.json(
        { error: '缺少必需参数: platform' },
        { status: 400 }
      )
    }

    if (!environment) {
      return NextResponse.json(
        { error: '缺少必需参数: environment' },
        { status: 400 }
      )
    }

    // 4. 验证平台参数
    if (!isValidPlatform(platform)) {
      return NextResponse.json(
        { error: '不支持的平台: platform 必须是 macos, windows 或 linux' },
        { status: 400 }
      )
    }

    // 5. 验证环境参数
    if (!isValidEnvironment(platform, environment)) {
      return NextResponse.json(
        {
          error: `无效的 environment 参数: ${platform} 平台不支持 ${environment}`,
        },
        { status: 400 }
      )
    }

    // 6. 获取 API 密钥
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    })

    if (!apiKey) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    // 7. 检查权限
    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { error: '无权访问此密钥' },
        { status: 403 }
      )
    }

    // 8. 生成脚本
    const script = generateScript({
      platform,
      environment,
      keyValue: apiKey.crsKey, // 使用 crsKey 字段
      baseUrl: 'https://claude.just-play.fun/api',
    })

    // 9. 获取安装说明
    const instructions = getInstructions(platform, environment)

    // 10. 确定文件名
    const filename =
      platform === 'windows' && environment === 'powershell'
        ? 'setup_claude.ps1'
        : 'setup_claude.sh'

    // 11. 返回结果
    return NextResponse.json({
      script,
      filename,
      instructions,
    })
  } catch (error) {
    console.error('Script generation error:', error)

    // 处理特定错误
    if (error instanceof Error) {
      if (error.message.includes('不支持')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
