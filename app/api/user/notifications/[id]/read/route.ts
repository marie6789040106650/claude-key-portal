/**
 * 标记通知为已读 API
 * PUT /api/user/notifications/[id]/read - 标记单个通知为已读
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT - 标记通知为已读
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证认证
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    try {
      // 更新通知为已读
      const notification = await prisma.notification.update({
        where: {
          id: params.id,
          userId: decoded.userId,
        },
        data: {
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        message: '通知已标记为已读',
        readAt: notification.readAt?.toISOString(),
      })
    } catch (updateError: any) {
      if (updateError.code === 'P2025' || updateError.message.includes('not found')) {
        return NextResponse.json({ error: '通知不存在' }, { status: 404 })
      }
      throw updateError
    }
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('标记通知已读失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}
