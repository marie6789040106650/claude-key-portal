/**
 * User Profile API Routes
 * GET /api/user/profile - 获取用户信息
 * PUT /api/user/profile - 更新用户信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/user/profile
 * 获取当前用户的完整信息和统计数据
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未提供认证信息' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 2. 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 3. 查询 API Key 数量
    const apiKeyCount = await prisma.apiKey.count({
      where: { userId: decoded.userId },
    })

    // 4. 返回用户信息和统计
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      stats: {
        apiKeyCount,
      },
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)

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
 * PUT /api/user/profile
 * 更新用户信息（昵称、头像、简介）
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未提供认证信息' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader)

    // 2. 解析请求体
    const body = await request.json()
    const { nickname, avatar, bio } = body

    // 3. 验证输入
    const updates: {
      nickname?: string
      avatar?: string
      bio?: string
    } = {}

    // 验证昵称
    if (nickname !== undefined) {
      if (typeof nickname !== 'string') {
        return NextResponse.json(
          { error: '昵称必须是字符串' },
          { status: 400 }
        )
      }
      if (nickname.length > 50) {
        return NextResponse.json(
          { error: '昵称长度不能超过50个字符' },
          { status: 400 }
        )
      }
      updates.nickname = nickname
    }

    // 验证头像
    if (avatar !== undefined) {
      if (typeof avatar !== 'string' && avatar !== null) {
        return NextResponse.json(
          { error: '头像必须是字符串或null' },
          { status: 400 }
        )
      }
      updates.avatar = avatar
    }

    // 验证简介
    if (bio !== undefined) {
      if (typeof bio !== 'string' && bio !== null) {
        return NextResponse.json(
          { error: '简介必须是字符串或null' },
          { status: 400 }
        )
      }
      if (bio && bio.length > 200) {
        return NextResponse.json(
          { error: '简介长度不能超过200个字符' },
          { status: 400 }
        )
      }
      updates.bio = bio
    }

    // 检查是否有需要更新的内容
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '没有需要更新的内容' },
        { status: 400 }
      )
    }

    // 4. 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updates,
    })

    // 5. 返回更新后的用户信息（手动选择字段，避免返回敏感信息）
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email!,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)

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
