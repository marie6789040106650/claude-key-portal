/**
 * JWT认证工具函数
 */

import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

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

  const token = authHeader.substring(7).trim()

  // 检查提取的token是否为空
  if (!token) {
    throw new Error('未登录或Token缺失')
  }

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

/**
 * 获取当前登录用户
 * 从 Cookie 中读取 token 并验证
 */
export async function getCurrentUser(): Promise<{
  id: string
  email: string | null
} | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    return {
      id: decoded.userId,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}

/**
 * 获取已认证用户（支持双重认证）
 * 优先从 Authorization Header 读取，其次从 Cookie 读取
 *
 * @param request - Next.js Request 对象
 * @returns 用户信息或 null
 *
 * 使用场景:
 * - API调用: 通过 Authorization Header 传递 token
 * - 浏览器: 通过 Cookie 传递 token
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<{
  id: string
  email: string | null
} | null> {
  try {
    // 1. 尝试从 Authorization Header 获取 token
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim()
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

          // 验证token类型
          if (decoded.type && decoded.type !== 'access') {
            return null
          }

          return {
            id: decoded.userId,
            email: decoded.email,
          }
        } catch (error) {
          // Header token 无效，继续尝试 Cookie
        }
      }
    }

    // 2. 尝试从 Cookie 获取 token
    const cookieStore = cookies()
    const cookieToken = cookieStore.get('accessToken')?.value

    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET!) as any

        return {
          id: decoded.userId,
          email: decoded.email,
        }
      } catch (error) {
        // Cookie token 也无效
        return null
      }
    }

    // 3. 两种方式都没有有效 token
    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}
