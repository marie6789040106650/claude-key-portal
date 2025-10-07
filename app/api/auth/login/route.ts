/**
 * 用户登录 API
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server'
import { LoginUseCase } from '@/lib/application/user'
import { userRepository, sessionRepository } from '@/lib/infrastructure/persistence/repositories'
import { passwordService, jwtService } from '@/lib/infrastructure/auth'

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body = await request.json()

    // 2. 获取请求元信息
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 3. 创建UseCase实例
    const loginUseCase = new LoginUseCase(
      userRepository,
      sessionRepository,
      passwordService,
      jwtService
    )

    // 4. 执行登录流程
    const result = await loginUseCase.execute({
      ...body,
      ip,
      userAgent,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json(result.value, { status: 200 })
    } else {
      // 根据错误类型返回不同状态码
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'UnauthorizedError') {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      if (error.name === 'ForbiddenError') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
