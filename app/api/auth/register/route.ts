/**
 * 用户注册 API
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validation/auth'
import { checkUserExists, createUser } from '@/lib/services/auth.service'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body = await request.json()

    // 2. 验证输入
    let validatedData
    try {
      validatedData = registerSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return NextResponse.json(
          { error: firstError.message },
          { status: 400 }
        )
      }
      throw error
    }

    const { email, phone } = validatedData

    // 3. 检查用户是否已存在
    const existingUser = await checkUserExists(email, phone)

    if (existingUser) {
      return NextResponse.json(
        { error: email ? '该邮箱已被注册' : '该手机号已被注册' },
        { status: 409 }
      )
    }

    // 4. 创建用户
    const user = await createUser(validatedData)

    // 5. 返回成功响应
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
