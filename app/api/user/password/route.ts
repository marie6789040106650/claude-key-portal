/**
 * Password Management API Routes
 * PUT /api/user/password - 修改密码
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcrypt'

/**
 * 验证密码强度
 * 至少8位，包含大小写字母、数字和特殊字符
 */
function validatePasswordStrength(password: string): {
  valid: boolean
  error?: string
} {
  if (password.length < 8) {
    return {
      valid: false,
      error: '密码强度不足：至少8位字符',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: '密码强度不足：必须包含大写字母',
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: '密码强度不足：必须包含小写字母',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: '密码强度不足：必须包含数字',
    }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: '密码强度不足：必须包含特殊字符',
    }
  }

  return { valid: true }
}

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
    const { oldPassword, newPassword } = body

    // 3. 验证必需参数
    if (!oldPassword) {
      return NextResponse.json(
        { error: '缺少必需参数: oldPassword' },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: '缺少必需参数: newPassword' },
        { status: 400 }
      )
    }

    // 4. 验证新密码强度
    const strengthCheck = validatePasswordStrength(newPassword)
    if (!strengthCheck.valid) {
      return NextResponse.json({ error: strengthCheck.error }, { status: 400 })
    }

    // 5. 查询用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 兼容测试环境和生产环境的字段名
    const currentPasswordHash =
      (user as any).passwordHash || (user as any).password

    // 6. 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      currentPasswordHash
    )

    if (!isOldPasswordValid) {
      return NextResponse.json({ error: '旧密码不正确' }, { status: 400 })
    }

    // 7. 验证新密码不能与旧密码相同
    const isSamePassword = await bcrypt.compare(newPassword, currentPasswordHash)

    if (isSamePassword) {
      return NextResponse.json(
        { error: '新密码不能与旧密码相同' },
        { status: 400 }
      )
    }

    // 8. 哈希新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // 9. 记录密码修改历史
    await prisma.passwordHistory.create({
      data: {
        userId: decoded.userId,
        hashedPassword: currentPasswordHash, // 保存旧密码
      },
    })

    // 10. 更新密码
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash: hashedNewPassword },
    })

    // 11. 返回成功
    return NextResponse.json({
      message: '密码修改成功',
    })
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
