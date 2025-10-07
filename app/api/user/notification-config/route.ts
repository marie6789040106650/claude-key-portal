/**
 * 用户通知配置 API
 * GET /api/user/notification-config - 获取配置
 * PUT /api/user/notification-config - 更新配置
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

/**
 * GET - 获取用户通知配置
 */
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 查找用户配置
    let config = await prisma.notificationConfig.findUnique({
      where: { userId: decoded.userId },
    })

    // 如果配置不存在，创建默认配置
    if (!config) {
      config = await prisma.notificationConfig.create({
        data: {
          userId: decoded.userId,
          channels: {
            email: {
              enabled: false,
              address: '',
            },
            webhook: {
              enabled: false,
              url: '',
            },
            system: {
              enabled: true,
            },
          },
          rules: [],
        },
      })
    }

    return NextResponse.json({
      id: config.id,
      userId: config.userId,
      channels: config.channels,
      rules: config.rules,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('获取通知配置失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}

/**
 * PUT - 更新用户通知配置
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证认证
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 解析请求体
    const body = await request.json()
    const { channels, rules } = body

    // 验证输入
    const validation = validateNotificationConfig({ channels, rules })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 更新配置
    const config = await prisma.notificationConfig.update({
      where: { userId: decoded.userId },
      data: {
        channels,
        rules,
      },
    })

    return NextResponse.json({
      id: config.id,
      userId: config.userId,
      channels: config.channels,
      rules: config.rules,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('更新通知配置失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}

/**
 * 验证通知配置
 */
function validateNotificationConfig(config: {
  channels?: any
  rules?: any
}): { valid: boolean; error?: string } {
  const { channels, rules } = config

  // 验证渠道配置
  if (channels) {
    // 验证邮箱地址
    if (channels.email?.enabled && channels.email?.address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(channels.email.address)) {
        return { valid: false, error: '邮箱地址格式不正确' }
      }
    }

    // 验证 Webhook URL
    if (channels.webhook?.enabled && channels.webhook?.url) {
      if (!channels.webhook.url.startsWith('https://')) {
        return { valid: false, error: 'Webhook URL 必须使用 HTTPS' }
      }
    }

    // 检查是否至少启用一个渠道
    const anyEnabled =
      channels.email?.enabled || channels.webhook?.enabled || channels.system?.enabled

    if (!anyEnabled) {
      return { valid: false, error: '至少需要启用一个通知渠道' }
    }
  }

  // 验证规则
  if (rules && Array.isArray(rules)) {
    for (const rule of rules) {
      if (rule.threshold !== undefined) {
        if (rule.threshold < 0 || rule.threshold > 100) {
          return { valid: false, error: '阈值必须在 0-100 之间' }
        }
      }
    }
  }

  return { valid: true }
}
