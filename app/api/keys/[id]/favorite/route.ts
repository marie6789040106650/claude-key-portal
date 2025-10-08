/**
 * Favorite API 路由
 * P1 阶段 - 收藏功能 🟢 GREEN
 *
 * PATCH /api/keys/[id]/favorite
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户登录
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 解析请求体
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }

    // 3. 验证输入
    const { isFavorite } = body

    if (isFavorite === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: isFavorite' },
        { status: 400 }
      )
    }

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite 必须是布尔值' },
        { status: 400 }
      )
    }

    // 4. 查找密钥
    const key = await prisma.apiKey.findUnique({
      where: { id: params.id },
    })

    if (!key) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    // 5. 验证权限
    if (key.userId !== user.id) {
      return NextResponse.json(
        { error: '无权操作此密钥' },
        { status: 403 }
      )
    }

    // 6. 更新收藏状态
    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: { isFavorite },
      select: {
        id: true,
        isFavorite: true,
        name: true,
      },
    })

    return NextResponse.json({
      success: true,
      isFavorite: updatedKey.isFavorite,
      key: updatedKey,
    })
  } catch (error) {
    console.error('Failed to update favorite status:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
