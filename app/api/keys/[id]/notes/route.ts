/**
 * Notes API 路由
 * P1 阶段 - 备注功能 🟢 GREEN
 *
 * PATCH /api/keys/[id]/notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户登录
    const user = await getAuthenticatedUser(request)
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
    const { description } = body

    if (description === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: description' },
        { status: 400 }
      )
    }

    if (description !== null && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'description 必须是字符串或 null' },
        { status: 400 }
      )
    }

    // 去除首尾空格
    const trimmedDescription = description?.trim() || null

    // 验证长度
    if (trimmedDescription && trimmedDescription.length > 1000) {
      return NextResponse.json(
        { error: '备注最多 1000 个字符' },
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

    // 6. 更新备注
    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: { description: trimmedDescription },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      description: updatedKey.description,
      key: updatedKey,
    })
  } catch (error) {
    console.error('Failed to update notes:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
