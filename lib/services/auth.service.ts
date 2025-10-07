/**
 * 认证服务
 * 封装用户注册、登录的核心业务逻辑
 */

import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { redis } from '@/lib/infrastructure/cache/redis'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RegisterInput, LoginInput } from '@/lib/validation/auth'

/**
 * 检查用户是否已存在
 */
export async function checkUserExists(email?: string, phone?: string) {
  if (!email && !phone) {
    return null
  }

  return await prisma.user.findUnique({
    where: email ? { email } : { phone },
  })
}

/**
 * 创建新用户
 */
export async function createUser(data: RegisterInput) {
  const { email, phone, password, nickname } = data

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10)

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      nickname,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      nickname: true,
      createdAt: true,
    },
  })

  return user
}

/**
 * 验证用户密码
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
) {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * 生成 JWT Token
 */
export function generateTokens(userId: string, email: string | null) {
  const accessToken = jwt.sign(
    {
      userId,
      email,
      type: 'access',
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )

  const refreshToken = jwt.sign(
    {
      userId,
      email,
      type: 'refresh',
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

/**
 * 创建用户会话
 */
export async function createSession(
  userId: string,
  accessToken: string,
  refreshToken: string,
  ip: string = '0.0.0.0',
  userAgent: string = 'Unknown'
) {
  const session = await prisma.session.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      ip, // Required field
      userAgent, // Required field
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  // 缓存到 Redis（失败不影响流程）
  try {
    await redis.setex(
      `session:${accessToken}`,
      86400, // 24 hours in seconds
      JSON.stringify({
        userId,
        sessionId: session.id,
      })
    )
  } catch (error) {
    console.warn('Redis cache failed:', error)
  }

  return session
}

/**
 * 更新用户最后登录时间
 */
export async function updateLastLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * 检查用户账户状态
 */
export function checkAccountStatus(status: string) {
  if (status === 'SUSPENDED') {
    return { valid: false, error: '账户已被停用，请联系管理员' }
  }

  if (status === 'DELETED') {
    return { valid: false, error: '账户不存在' }
  }

  return { valid: true }
}

/**
 * 准备用户响应数据（移除敏感信息）
 */
export function sanitizeUser(user: any) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}
