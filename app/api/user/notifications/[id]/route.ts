/**
 * 单个通知操作 API
 * GET /api/user/notifications/[id] - 获取通知详情
 * DELETE /api/user/notifications/[id] - 删除通知
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

/**
 * GET - 获取通知详情
 */
export async function GET(
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

    // 查找通知
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: '通知不存在' }, { status: 404 })
    }

    return NextResponse.json({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      channel: notification.channel,
      status: notification.status,
      sentAt: notification.sentAt?.toISOString() || null,
      readAt: notification.readAt?.toISOString() || null,
      createdAt: notification.createdAt.toISOString(),
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('获取通知详情失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}

/**
 * DELETE - 删除通知
 */
export async function DELETE(
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
      // 删除通知
      await prisma.notification.delete({
        where: {
          id: params.id,
          userId: decoded.userId,
        },
      })

      return NextResponse.json({ message: '通知已删除' })
    } catch (deleteError: any) {
      if (
        deleteError.code === 'P2025' ||
        deleteError.message.includes('not found') ||
        deleteError.message.includes('does not exist')
      ) {
        return NextResponse.json({ error: '通知不存在' }, { status: 404 })
      }
      throw deleteError
    }
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('删除通知失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}
