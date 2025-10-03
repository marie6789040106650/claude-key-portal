/**
 * 用户登录功能测试
 * Sprint 1 - 🔴 RED Phase
 */

import { POST } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    setex: jest.fn(),
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

describe('POST /api/auth/login', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    phone: null,
    passwordHash: 'hashed_password',
    nickname: 'Test User',
    status: 'ACTIVE' as const,
    emailVerified: true,
    lastLoginAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test_jwt_secret'
  })

  describe('✅ 成功场景', () => {
    it('应该成功使用邮箱登录', async () => {
      // Arrange
      const mockAccessToken = 'access_token_123'
      const mockRefreshToken = 'refresh_token_456'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken)
      ;(prisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session_123',
        userId: mockUser.id,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      })
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('accessToken', mockAccessToken)
      expect(data).toHaveProperty('refreshToken', mockRefreshToken)
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('id', mockUser.id)
      expect(data.user).not.toHaveProperty('passwordHash')

      // 验证调用
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Test@123456',
        mockUser.passwordHash
      )
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      })
      expect(prisma.session.create).toHaveBeenCalled()
      expect(redis.setex).toHaveBeenCalled()
    })

    it('应该成功使用手机号登录', async () => {
      // Arrange
      const userWithPhone = {
        ...mockUser,
        email: null,
        phone: '13800138000',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithPhone)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({})
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: '13800138000',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.user).toHaveProperty('phone', '13800138000')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '13800138000' },
      })
    })

    it('应该生成正确的 JWT Token', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({})
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          type: 'access',
        },
        'test_jwt_secret',
        { expiresIn: '24h' }
      )

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          type: 'refresh',
        },
        'test_jwt_secret',
        { expiresIn: '7d' }
      )
    })

    it('应该在 Redis 中缓存 Session', async () => {
      // Arrange
      const mockAccessToken = 'access_token_123'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session_123',
        userId: mockUser.id,
      })
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(redis.setex).toHaveBeenCalledWith(
        `session:${mockAccessToken}`,
        86400, // 24 hours in seconds
        expect.any(String)
      )
    })
  })

  describe('❌ 失败场景 - 输入验证', () => {
    it('应该拒绝缺少邮箱和手机号的请求', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('邮箱或手机号')
    })

    it('应该拒绝缺少密码的请求', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('密码')
    })
  })

  describe('❌ 失败场景 - 认证失败', () => {
    it('应该拒绝不存在的用户', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('邮箱或密码错误')
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('应该拒绝错误的密码', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toContain('邮箱或密码错误')
      expect(prisma.session.create).not.toHaveBeenCalled()
    })

    it('应该拒绝已停用的用户', async () => {
      // Arrange
      const suspendedUser = {
        ...mockUser,
        status: 'SUSPENDED' as const,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(suspendedUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toContain('账户已被停用')
      expect(prisma.session.create).not.toHaveBeenCalled()
    })

    it('应该拒绝已删除的用户', async () => {
      // Arrange
      const deletedUser = {
        ...mockUser,
        status: 'DELETED' as const,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(deletedUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toContain('账户不存在')
    })
  })

  describe('❌ 失败场景 - 系统错误', () => {
    it('应该处理数据库查询错误', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })

    it('应该处理 Session 创建错误', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockRejectedValue(
        new Error('Session creation failed')
      )

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toContain('系统错误')
    })

    it('应该处理 Redis 缓存错误但继续登录', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session_123',
      })
      ;(redis.setex as jest.Mock).mockRejectedValue(
        new Error('Redis connection failed')
      )

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      // Redis 失败不应该影响登录
      expect(response.status).toBe(200)
    })
  })

  describe('🔒 安全性检查', () => {
    it('响应中不应该包含密码哈希', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({})
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.user).not.toHaveProperty('passwordHash')
      expect(data.user).not.toHaveProperty('password')
    })

    it('错误消息不应该暴露用户是否存在', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request1 = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Test@123456',
        }),
      })

      // Act - 用户不存在
      const response1 = await POST(request1)
      const data1 = await response1.json()

      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const request2 = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        }),
      })

      // Act - 密码错误
      const response2 = await POST(request2)
      const data2 = await response2.json()

      // Assert - 错误消息应该相同
      expect(data1.error).toBe(data2.error)
      expect(data1.error).not.toContain('不存在')
      expect(data1.error).not.toContain('错误的密码')
    })

    it('应该使用 bcrypt 验证密码', async () => {
      // Arrange
      const mockPassword = 'Test@123456'

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({})
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: mockPassword,
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockPassword,
        mockUser.passwordHash
      )
    })

    it('应该使用环境变量中的 JWT_SECRET', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')
      ;(prisma.session.create as jest.Mock).mockResolvedValue({})
      ;(redis.setex as jest.Mock).mockResolvedValue('OK')

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123456',
        }),
      })

      // Act
      await POST(request)

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test_jwt_secret',
        expect.any(Object)
      )
    })
  })
})
