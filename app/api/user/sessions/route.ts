/**
 * Session Management API Routes
 * GET /api/user/sessions - 获取活跃 Session 列表
 * DELETE /api/user/sessions - 删除所有其他 Session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * 隐藏 token 完整内容，只显示前后4位
 */
function maskToken(token: string): string {
  if (token.length <= 8) return token
  const prefix = token.slice(0, 4)
  const suffix = token.slice(-4)
  return `${prefix}...${suffix}`
}

/**
 * GET /api/user/sessions
 * 获取用户所有活跃 Session
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未提供认证信息' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 2. 查询用户的所有 Session
    const sessions = await prisma.session.findMany({
      where: { userId: decoded.userId },
      orderBy: { lastActivityAt: 'desc' },
    })

    // 3. 隐藏完整 token，只返回部分信息
    const maskedSessions = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      token: maskToken(session.accessToken),
      deviceInfo: session.deviceName || session.userAgent,
      ipAddress: session.ip,
      lastActive: session.lastActivityAt,
      createdAt: session.createdAt,
    }))

    return NextResponse.json({ sessions: maskedSessions })
  } catch (error) {
    console.error('获取 Session 列表失败:', error)

    if (error instanceof Error && error.message === 'Token无效或已过期') {
      return NextResponse.json(
        { error: 'Token无效或已过期' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/sessions
 * 删除所有其他 Session（保留当前）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未提供认证信息' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 2. 获取当前 Session ID
    const currentSessionId = (decoded as any).sessionId

    // 3. 删除所有其他 Session
    const result = await prisma.session.deleteMany({
      where: {
        userId: decoded.userId,
        id: { not: currentSessionId },
      },
    })

    return NextResponse.json({
      message: '已登出所有其他设备',
      count: result.count,
    })
  } catch (error) {
    console.error('删除 Session 失败:', error)

    if (error instanceof Error && error.message === 'Token无效或已过期') {
      return NextResponse.json(
        { error: 'Token无效或已过期' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
