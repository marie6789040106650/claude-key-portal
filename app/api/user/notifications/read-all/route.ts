/**
 * 批量标记通知为已读 API
 * PUT /api/user/notifications/read-all - 批量标记未读通知为已读
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT - 批量标记未读通知为已读
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
    const { type, before } = body

    // 构建更新条件
    const where: any = {
      userId: decoded.userId,
      readAt: null, // 只标记未读通知
    }

    if (type) {
      where.type = type
    }

    if (before) {
      where.createdAt = { lte: new Date(before) }
    }

    // 执行批量更新
    const result = await prisma.notification.updateMany({
      where,
      data: {
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `已标记 ${result.count} 条通知为已读`,
      count: result.count,
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('批量标记已读失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}
