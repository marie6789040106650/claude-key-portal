/**
 * JWT Token 验证中间件测试
 * Sprint 11 - 🔴 RED Phase
 * @jest-environment node
 */

import { verifyToken } from '@/lib/auth'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('verifyToken', () => {
  const mockUserId = 'user-123'
  const mockEmail = 'test@example.com'
  const validToken = 'Bearer valid.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test_secret'
  })

  describe('✅ 成功场景', () => {
    it('应该成功验证有效的 access token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', 'test_secret')
    })

    it('应该接受没有 type 字段的旧版 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        // 没有 type 字段（向后兼容）
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
    })

    it('应该正确解析 Bearer token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      verifyToken('Bearer token123')

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('token123', 'test_secret')
    })

    it('应该处理 email 为 null 的情况', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: null,
        type: 'access',
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: null,
      })
    })
  })

  describe('❌ 失败场景 - 缺失或无效的 Authorization Header', () => {
    it('应该拒绝 null Authorization header', () => {
      // Act & Assert
      expect(() => verifyToken(null)).toThrow('未登录或Token缺失')
    })

    it('应该拒绝 undefined Authorization header', () => {
      // Act & Assert
      expect(() => verifyToken(undefined as any)).toThrow('未登录或Token缺失')
    })

    it('应该拒绝空字符串 Authorization header', () => {
      // Act & Assert
      expect(() => verifyToken('')).toThrow('未登录或Token缺失')
    })

    it('应该拒绝不以 "Bearer " 开头的 header', () => {
      // Act & Assert
      expect(() => verifyToken('Basic abc123')).toThrow('未登录或Token缺失')
      expect(() => verifyToken('Token abc123')).toThrow('未登录或Token缺失')
      expect(() => verifyToken('abc123')).toThrow('未登录或Token缺失')
    })

    it('应该拒绝只有 "Bearer" 没有 token 的 header', () => {
      // Act & Assert
      expect(() => verifyToken('Bearer ')).toThrow()
    })
  })

  describe('❌ 失败场景 - Token 验证失败', () => {
    it('应该拒绝过期的 token', () => {
      // Arrange
      const expiredError = new Error('jwt expired')
      expiredError.name = 'TokenExpiredError'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError
      })

      // Act & Assert
      expect(() => verifyToken(validToken)).toThrow('Token已过期，请重新登录')
    })

    it('应该拒绝无效签名的 token', () => {
      // Arrange
      const invalidError = new Error('invalid signature')
      invalidError.name = 'JsonWebTokenError'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError
      })

      // Act & Assert
      expect(() => verifyToken(validToken)).toThrow('Token无效')
    })

    it('应该拒绝格式错误的 token', () => {
      // Arrange
      const malformedError = new Error('jwt malformed')
      malformedError.name = 'JsonWebTokenError'
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw malformedError
      })

      // Act & Assert
      expect(() => verifyToken(validToken)).toThrow('Token无效')
    })

    it('应该拒绝错误类型的 token (refresh token)', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'refresh', // 应该是 access 类型
      })

      // Act & Assert
      expect(() => verifyToken(validToken)).toThrow('Token类型错误')
    })

    it('应该拒绝未知类型的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'unknown',
      })

      // Act & Assert
      expect(() => verifyToken(validToken)).toThrow('Token类型错误')
    })
  })

  describe('❌ 失败场景 - Token payload 缺失必要字段', () => {
    it('应该处理缺少 userId 的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        email: mockEmail,
        type: 'access',
        // 缺少 userId
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      // 返回 undefined 作为 userId
      expect(result.userId).toBeUndefined()
      expect(result.email).toBe(mockEmail)
    })

    it('应该处理缺少 email 的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        type: 'access',
        // 缺少 email
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result.userId).toBe(mockUserId)
      expect(result.email).toBeUndefined()
    })
  })

  describe('🔒 安全性检查', () => {
    it('应该使用环境变量中的 JWT_SECRET', () => {
      // Arrange
      const customSecret = 'custom_secret_key'
      process.env.JWT_SECRET = customSecret
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      verifyToken(validToken)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        expect.any(String),
        customSecret
      )
    })

    it('应该从 Authorization header 中提取正确的 token', () => {
      // Arrange
      const actualToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      verifyToken(`Bearer ${actualToken}`)

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(actualToken, expect.any(String))
    })

    it('不应该接受多个 Bearer 前缀', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      verifyToken('Bearer Bearer token123')

      // Assert
      // 应该提取 "Bearer token123" 作为 token（包含第二个 Bearer）
      expect(jwt.verify).toHaveBeenCalledWith('Bearer token123', expect.any(String))
    })
  })

  describe('⚠️ 边界条件', () => {
    it('应该处理非常长的 token', () => {
      // Arrange
      const longToken = 'a'.repeat(10000)
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      const result = verifyToken(`Bearer ${longToken}`)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
      expect(jwt.verify).toHaveBeenCalledWith(longToken, expect.any(String))
    })

    it('应该处理包含特殊字符的 email', () => {
      // Arrange
      const specialEmail = 'test+tag@example.com'
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: specialEmail,
        type: 'access',
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result.email).toBe(specialEmail)
    })

    it('应该处理非标准的 userId 格式', () => {
      // Arrange
      const uuidUserId = '123e4567-e89b-12d3-a456-426614174000'
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: uuidUserId,
        email: mockEmail,
        type: 'access',
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result.userId).toBe(uuidUserId)
    })
  })

  describe('🔄 向后兼容性', () => {
    it('应该接受旧版没有 type 字段的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        // 旧版 token 没有 type 字段
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
    })

    it('应该接受 type 为 null 的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: null,
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
    })

    it('应该接受 type 为 undefined 的 token', () => {
      // Arrange
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUserId,
        email: mockEmail,
        type: undefined,
      })

      // Act
      const result = verifyToken(validToken)

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
      })
    })
  })
})
