/**
 * Password Management API Routes
 * PUT /api/user/password - 修改密码
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

/**
 * PUT /api/user/password
 * 修改用户密码
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

    // 3. 创建UseCase实例
    const { UpdatePasswordUseCase } = await import('@/lib/application/user')
    const { userRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { passwordService } = await import('@/lib/infrastructure/auth')
    const updatePasswordUseCase = new UpdatePasswordUseCase(
      userRepository,
      passwordService
    )

    // 4. 执行密码更新流程
    const result = await updatePasswordUseCase.execute({
      userId: decoded.userId,
      currentPassword: body.oldPassword || body.currentPassword,
      newPassword: body.newPassword,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json({ message: '密码修改成功' }, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'ValidationError' || error.name === 'UnauthorizedError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'NotFoundError') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error) {
    console.error('修改密码失败:', error)

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
