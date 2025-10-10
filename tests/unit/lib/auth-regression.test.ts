/**
 * API认证回归测试
 *
 * 测试目标：验证所有API正确支持Cookie和Header双重认证
 * 修复背景：P0-7系列问题 - 从verifyToken迁移到getAuthenticatedUser
 *
 * 相关文档：
 * - docs/verification/reports/AUTH_UNIFICATION_COMPLETE.md
 * - docs/verification/reports/JOURNEY-2-5-COMPLETE-REPORT.md
 *
 * 🔴 RED Phase: 测试先行
 * @jest-environment node
 */

// 重要：取消全局auth-mock，使用真实实现
jest.unmock('@/lib/auth')

import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

// 动态导入真实的getAuthenticatedUser实现
import { getAuthenticatedUser } from '@/lib/auth'

describe('API Authentication Regression Tests', () => {
  const mockUserId = 'user-123'
  const mockEmail = 'test@example.com'
  const validToken = 'valid.jwt.token'
  const JWT_SECRET = 'test_secret'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('✅ Cookie认证支持（P0-7修复核心功能）', () => {
    it('should authenticate user via Cookie (accessToken)', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: mockUserId,
        email: mockEmail,
      })
      expect(mockCookieStore.get).toHaveBeenCalledWith('accessToken')
      expect(jwt.verify).toHaveBeenCalledWith(validToken, JWT_SECRET)
    })

    it('should handle Cookie without type field (backward compatibility)', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        // 旧版token没有type字段
      })

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: mockUserId,
        email: mockEmail,
      })
    })

    it('should return null if Cookie token is invalid', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed')
      })

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
    })

    it('should return null if Cookie token has wrong type', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'refresh', // 错误的token类型
      })

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
    })

    it('should return null if no Cookie exists', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined), // Cookie不存在
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith('accessToken')
    })
  })

  describe('✅ Header认证支持（向后兼容）', () => {
    it('should authenticate user via Authorization Header', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: mockUserId,
        email: mockEmail,
      })
      expect(jwt.verify).toHaveBeenCalledWith(validToken, JWT_SECRET)
    })

    it('should handle Header token without type field', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        // 没有type字段
      })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: mockUserId,
        email: mockEmail,
      })
    })

    it('should return null if Header token is invalid', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('jwt malformed')
      })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
    })

    it('should return null if Authorization Header has wrong format', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Basic invalid', // 不是Bearer格式
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
      expect(jwt.verify).not.toHaveBeenCalled()
    })
  })

  describe('🔄 双重认证优先级（Header优先）', () => {
    it('should prefer Header token over Cookie token', async () => {
      // Arrange
      const headerToken = 'header-token'
      const cookieToken = 'cookie-token'

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: cookieToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      // 第一次调用（Header token验证）
      ;(jwt.verify as jest.Mock).mockReturnValueOnce({
        userId: 'header-user',
        email: 'header@example.com',
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${headerToken}`,
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: 'header-user',
        email: 'header@example.com',
      })
      // 应该只验证Header token，不验证Cookie
      expect(jwt.verify).toHaveBeenCalledTimes(1)
      expect(jwt.verify).toHaveBeenCalledWith(headerToken, JWT_SECRET)
      expect(mockCookieStore.get).not.toHaveBeenCalled()
    })

    it('should fallback to Cookie if Header token is invalid', async () => {
      // Arrange
      const headerToken = 'invalid-header-token'
      const cookieToken = 'valid-cookie-token'

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: cookieToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      // 第一次调用（Header token无效）
      ;(jwt.verify as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('jwt malformed')
        })
        // 第二次调用（Cookie token有效）
        .mockReturnValueOnce({
          userId: 'cookie-user',
          email: 'cookie@example.com',
          type: 'access',
        })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: `Bearer ${headerToken}`,
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toEqual({
        id: 'cookie-user',
        email: 'cookie@example.com',
      })
      // 应该验证了Header（失败）和Cookie（成功）
      expect(jwt.verify).toHaveBeenCalledTimes(2)
      expect(jwt.verify).toHaveBeenNthCalledWith(1, headerToken, JWT_SECRET)
      expect(jwt.verify).toHaveBeenNthCalledWith(2, cookieToken, JWT_SECRET)
    })
  })

  describe('❌ 未认证请求拒绝', () => {
    it('should return null when no authentication provided', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith('accessToken')
      expect(jwt.verify).not.toHaveBeenCalled()
    })

    it('should return null when both Header and Cookie tokens are invalid', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'invalid-cookie' }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      // 两次验证都失败
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed')
      })

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer invalid-header',
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
      expect(jwt.verify).toHaveBeenCalledTimes(2)
    })
  })

  describe('🔒 安全性验证', () => {
    it('should reject empty Bearer token', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          Authorization: 'Bearer ', // 空token
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
      expect(jwt.verify).not.toHaveBeenCalled()
    })

    it('should handle expired tokens gracefully', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const expiredError = new Error('jwt expired')
      expiredError.name = 'TokenExpiredError'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError
      })

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
    })

    it('should handle malformed tokens gracefully', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'malformed.token' }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const malformedError = new Error('jwt malformed')
      malformedError.name = 'JsonWebTokenError'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw malformedError
      })

      const request = new Request('http://localhost:3000/api/test')

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).toBeNull()
    })

    it('should not throw errors on authentication failure', async () => {
      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Cookie store error')
        }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      const request = new Request('http://localhost:3000/api/test')

      // Act & Assert
      await expect(getAuthenticatedUser(request)).resolves.toBeNull()
    })
  })

  describe('📊 P0-7系列问题回归测试', () => {
    it('should support Cookie auth like modified APIs', async () => {
      /**
       * 验证修复模式：
       *
       * 修复前（❌）:
       * const authHeader = request.headers.get('Authorization')
       * const tokenData = verifyToken(authHeader) // 只支持Header
       *
       * 修复后（✅）:
       * const user = await getAuthenticatedUser(request) // 支持Cookie+Header
       */

      // Arrange - 模拟前端通过Cookie发送token
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: validToken }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // 没有Authorization Header（前端使用Cookie）
      const request = new Request('http://localhost:3000/api/keys/123/rename', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).not.toBeNull()
      expect(user?.id).toBe(mockUserId)

      // ✅ 验证通过：Cookie认证成功
      // 这证明P0-7修复有效
    })

    it('should maintain backward compatibility with Header auth', async () => {
      /**
       * 验证向后兼容性：
       * 原有使用Authorization Header的客户端仍然可以正常工作
       */

      // Arrange
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      const request = new Request('http://localhost:3000/api/keys', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      })

      // Act
      const user = await getAuthenticatedUser(request)

      // Assert
      expect(user).not.toBeNull()
      expect(user?.id).toBe(mockUserId)

      // ✅ 向后兼容：Header认证仍然有效
    })
  })
})
