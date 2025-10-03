/**
 * JWT认证工具函数
 */

import jwt from 'jsonwebtoken'

/**
 * JWT Token验证
 */
export function verifyToken(authHeader: string | null): {
  userId: string
  email: string | null
} {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('未登录或Token缺失')
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // 先检查token类型，如果不是access类型则抛出特定错误
    if (decoded.type && decoded.type !== 'access') {
      throw new Error('Token类型错误')
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    }
  } catch (error: any) {
    // 如果是Token类型错误，直接抛出
    if (error.message === 'Token类型错误') {
      throw error
    }

    if (error.name === 'TokenExpiredError') {
      throw new Error('Token已过期，请重新登录')
    }
    throw new Error('Token无效')
  }
}
