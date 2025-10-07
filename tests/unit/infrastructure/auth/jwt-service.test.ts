/**
 * JwtService 测试
 * Phase 2.2 - 🔴 RED Phase
 * @jest-environment node
 */

import { JwtService } from '@/lib/infrastructure/auth/jwt-service'
import jwt from 'jsonwebtoken'

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

describe('JwtService', () => {
  let service: JwtService
  const mockSecret = 'test_jwt_secret'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = mockSecret
    service = new JwtService()
  })

  describe('sign', () => {
    it('应该生成JWT token', async () => {
      // Arrange
      const payload = { userId: 'user_123', email: 'test@example.com' }
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

      ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)

      // Act
      const result = await service.sign(payload)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(mockToken)
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        mockSecret,
        expect.objectContaining({
          expiresIn: '24h',
        })
      )
    })

    it('应该使用自定义过期时间', async () => {
      // Arrange
      const payload = { userId: 'user_123' }
      const mockToken = 'token...'
      const customExpiry = '7d'

      ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)

      // Act
      const result = await service.sign(payload, customExpiry)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        mockSecret,
        expect.objectContaining({
          expiresIn: customExpiry,
        })
      )
    })

    it('当JWT签名失败时应该返回失败', async () => {
      // Arrange
      const payload = { userId: 'user_123' }
      const error = new Error('Sign failed')

      ;(jwt.sign as jest.Mock).mockImplementation(() => {
        throw error
      })

      // Act
      const result = await service.sign(payload)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Sign failed')
    })

    it('应该拒绝空payload', async () => {
      // Act
      const result = await service.sign(null as any)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Payload不能为空')
    })
  })

  describe('verify', () => {
    it('应该验证有效的token', async () => {
      // Arrange
      const token = 'valid_token'
      const mockPayload = { userId: 'user_123', email: 'test@example.com' }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)

      // Act
      const result = await service.verify(token)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(mockPayload)
      expect(jwt.verify).toHaveBeenCalledWith(token, mockSecret)
    })

    it('应该拒绝无效的token', async () => {
      // Arrange
      const token = 'invalid_token'
      const error = new Error('Invalid token')

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw error
      })

      // Act
      const result = await service.verify(token)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Invalid token')
    })

    it('应该拒绝过期的token', async () => {
      // Arrange
      const token = 'expired_token'
      const error = new Error('jwt expired')
      error.name = 'TokenExpiredError'

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw error
      })

      // Act
      const result = await service.verify(token)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('expired')
    })

    it('应该拒绝空token', async () => {
      // Act
      const result = await service.verify('')

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toContain('Token不能为空')
    })
  })

  describe('generateTokens', () => {
    it('应该生成access和refresh tokens', async () => {
      // Arrange
      const userId = 'user_123'
      const email = 'test@example.com'
      const mockAccessToken = 'access_token...'
      const mockRefreshToken = 'refresh_token...'

      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken) // access token
        .mockReturnValueOnce(mockRefreshToken) // refresh token

      // Act
      const result = await service.generateTokens(userId, email)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      })

      // 验证调用参数
      expect(jwt.sign).toHaveBeenCalledTimes(2)
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ userId, email, type: 'access' }),
        mockSecret,
        expect.objectContaining({ expiresIn: '24h' })
      )
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ userId, email, type: 'refresh' }),
        mockSecret,
        expect.objectContaining({ expiresIn: '7d' })
      )
    })

    it('应该处理null email', async () => {
      // Arrange
      const userId = 'user_123'
      const mockAccessToken = 'access_token...'
      const mockRefreshToken = 'refresh_token...'

      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken)

      // Act
      const result = await service.generateTokens(userId, null)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId, email: null }),
        mockSecret,
        expect.any(Object)
      )
    })

    it('当生成token失败时应该返回失败', async () => {
      // Arrange
      const userId = 'user_123'
      const email = 'test@example.com'
      const error = new Error('Token generation failed')

      ;(jwt.sign as jest.Mock).mockImplementation(() => {
        throw error
      })

      // Act
      const result = await service.generateTokens(userId, email)

      // Assert
      expect(result.isSuccess).toBe(false)
      expect(result.error?.message).toBe('Token generation failed')
    })
  })

  describe('decode (无验证)', () => {
    it('应该解码token而不验证', async () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyJ9.xxx'
      const mockPayload = { userId: 'user_123' }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)

      // Act
      const result = await service.decode(token)

      // Assert
      expect(result.isSuccess).toBe(true)
      expect(result.value).toEqual(mockPayload)
    })
  })

  describe('配置验证', () => {
    it('应该在没有JWT_SECRET时抛出错误', () => {
      // Arrange
      delete process.env.JWT_SECRET

      // Act & Assert
      expect(() => new JwtService()).toThrow('JWT_SECRET未配置')
    })
  })
})
