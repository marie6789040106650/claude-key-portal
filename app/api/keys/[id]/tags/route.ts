/**
 * Tags API 路由
 * P1 阶段 - 标签功能 🟢 GREEN
 *
 * POST /api/keys/[id]/tags - 添加标签
 * DELETE /api/keys/[id]/tags - 删除标签
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(
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
    const { tag, tags } = body

    if (!tag && !tags) {
      return NextResponse.json(
        { error: '缺少必填字段: tag 或 tags' },
        { status: 400 }
      )
    }

    const tagsToAdd = tags || [tag]
    const trimmedTags = tagsToAdd
      .map((t: string) => t?.trim())
      .filter(Boolean)

    if (trimmedTags.length === 0) {
      return NextResponse.json({ error: '标签不能为空' }, { status: 400 })
    }

    // 验证标签类型和长度
    for (const t of trimmedTags) {
      if (typeof t !== 'string') {
        return NextResponse.json(
          { error: '标签必须是字符串' },
          { status: 400 }
        )
      }
      if (t.length > 50) {
        return NextResponse.json(
          { error: '标签最多 50 个字符' },
          { status: 400 }
        )
      }
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

    // 6. 检查标签是否已存在
    const existingTags = key.tags as string[]
    const newTags = trimmedTags.filter((t: string) => !existingTags.includes(t))

    if (newTags.length === 0) {
      return NextResponse.json({
        success: true,
        message: '标签已存在',
        tags: existingTags,
      })
    }

    // 7. 检查标签数量限制
    const updatedTags = [...existingTags, ...newTags]
    if (updatedTags.length > 10) {
      return NextResponse.json(
        { error: '最多只能添加 10 个标签' },
        { status: 400 }
      )
    }

    // 8. 添加标签
    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: { tags: updatedTags },
      select: {
        id: true,
        tags: true,
      },
    })

    return NextResponse.json({
      success: true,
      tags: updatedKey.tags,
    })
  } catch (error) {
    console.error('Failed to add tags:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户登录
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 从URL查询参数读取tag
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    // 3. 验证输入
    if (!tag) {
      return NextResponse.json(
        { error: '缺少必填字段: tag' },
        { status: 400 }
      )
    }

    if (typeof tag !== 'string') {
      return NextResponse.json(
        { error: '标签必须是字符串' },
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

    // 6. 删除标签
    const existingTags = key.tags as string[]
    const updatedTags = existingTags.filter((t) => t !== tag)

    if (updatedTags.length === existingTags.length) {
      return NextResponse.json({
        success: true,
        message: '标签不存在',
        tags: updatedTags,
      })
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: { tags: updatedTags },
      select: {
        id: true,
        tags: true,
      },
    })

    return NextResponse.json({
      success: true,
      tags: updatedKey.tags,
    })
  } catch (error) {
    console.error('Failed to delete tag:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
