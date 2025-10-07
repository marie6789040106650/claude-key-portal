/**
 * 用户通知列表 API
 * GET /api/user/notifications - 获取通知列表（分页）
 * DELETE /api/user/notifications - 批量删除已读通知
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

/**
 * GET - 获取用户通知列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // 参数验证
    if (page < 1) {
      return NextResponse.json({ error: '页码必须大于 0' }, { status: 400 })
    }

    if (limit > 100) {
      return NextResponse.json({ error: '每页数量不能超过 100' }, { status: 400 })
    }

    // 构建查询条件
    const where: any = { userId: decoded.userId }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (unreadOnly) {
      where.readAt = null
    }

    // 查询通知列表
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // 查询总数
    const total = await prisma.notification.count({ where })

    // 查询未读数量
    const unreadCount = await prisma.notification.count({
      where: {
        userId: decoded.userId,
        readAt: null,
      },
    })

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        channel: n.channel,
        status: n.status,
        sentAt: n.sentAt?.toISOString() || null,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('获取通知列表失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}

/**
 * DELETE - 批量删除已读通知
 */
export async function DELETE(request: NextRequest) {
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

    // 构建删除条件
    const where: any = {
      userId: decoded.userId,
      readAt: { not: null }, // 只删除已读通知
    }

    if (type) {
      where.type = type
    }

    if (before) {
      where.createdAt = { lte: new Date(before) }
    }

    // 执行批量删除
    const result = await prisma.notification.deleteMany({ where })

    return NextResponse.json({
      message: `已删除 ${result.count} 条通知`,
      count: result.count,
    })
  } catch (error: any) {
    if (error.message === 'Token无效或已过期') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('批量删除通知失败:', error)
    return NextResponse.json({ error: '系统错误，请稍后重试' }, { status: 500 })
  }
}
