/**
 * 用户注册 API
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { RegisterUseCase } from '@/lib/application/user'
import { userRepository } from '@/lib/infrastructure/persistence/repositories'
import { passwordService } from '@/lib/infrastructure/auth'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body = await request.json()

    // 2. 创建UseCase实例
    const registerUseCase = new RegisterUseCase(userRepository, passwordService)

    // 3. 执行注册流程
    const result = await registerUseCase.execute(body)

    // 4. 处理结果
    if (result.isSuccess) {
      return NextResponse.json({ user: result.value }, { status: 201 })
    } else {
      // 根据错误类型返回不同状态码
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'ConflictError') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
