/**
 * 用户登录 API
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validation/auth'
import {
  checkUserExists,
  verifyPassword,
  checkAccountStatus,
  generateTokens,
  createSession,
  updateLastLogin,
} from '@/lib/services/auth.service'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body = await request.json()

    // 2. 验证输入
    let validatedData
    try {
      validatedData = loginSchema.parse(body)
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

    const { email, phone, password } = validatedData

    // 3. 查找用户
    const user = await checkUserExists(email, phone)

    // 4. 检查用户是否存在
    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // 5. 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // 6. 检查账户状态
    const accountStatus = checkAccountStatus(user.status)
    if (!accountStatus.valid) {
      return NextResponse.json(
        { error: accountStatus.error },
        { status: 403 }
      )
    }

    // 7. 生成 JWT Token
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    // 8. 创建 Session
    await createSession(user.id, accessToken, refreshToken)

    // 9. 更新最后登录时间
    await updateLastLogin(user.id)

    // 10. 返回成功响应（不包含密码哈希）
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
