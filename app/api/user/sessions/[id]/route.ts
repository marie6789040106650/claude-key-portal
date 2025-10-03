/**
 * Session Management API Routes
 * DELETE /api/user/sessions/[id] - 删除指定 Session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * DELETE /api/user/sessions/[id]
 * 删除指定的 Session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未提供认证信息' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 2. 查询 Session 是否存在
    const session = await prisma.session.findUnique({
      where: { id: params.id },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session 不存在' }, { status: 404 })
    }

    // 3. 验证 Session 是否属于当前用户
    if (session.userId !== decoded.userId) {
      return NextResponse.json(
        { error: '无权删除此 Session' },
        { status: 403 }
      )
    }

    // 4. 删除 Session
    await prisma.session.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Session 已删除' })
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
