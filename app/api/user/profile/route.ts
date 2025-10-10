/**
 * User Profile API Routes
 * GET /api/user/profile - 获取用户信息
 * PUT /api/user/profile - 更新用户信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/user/profile
 * 获取当前用户的完整信息和统计数据
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份（支持Cookie和Header双重认证）
    const authenticatedUser = await getAuthenticatedUser(request)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = authenticatedUser.id

    // 2. 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      where: { userId },
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
    // 1. 验证用户身份（支持Cookie和Header双重认证）
    const authenticatedUser = await getAuthenticatedUser(request)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = authenticatedUser.id

    // 2. 解析请求体
    const body = await request.json()

    // 3. 创建UseCase实例
    const { UpdateProfileUseCase } = await import('@/lib/application/user')
    const { userRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const updateProfileUseCase = new UpdateProfileUseCase(userRepository)

    // 4. 执行更新流程
    const result = await updateProfileUseCase.execute({
      userId,
      ...body,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json(result.value, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'NotFoundError') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
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
